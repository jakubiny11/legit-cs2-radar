#include "pch.hpp"
#include <atomic>

static std::atomic<int> g_update_delay_ms{ 30 };

bool main()
{
    config_data_t config_data = {};
    INIT_STEP("config system", cfg::setup(config_data));
    INIT_STEP("memory", m_memory->setup());
    INIT_STEP("interfaces", i::setup());
    INIT_STEP("schema", schema::setup());

    // Lower process priority to BELOW_NORMAL so CS2 game process gets 100% CPU priority
    SetPriorityClass(GetCurrentProcess(), BELOW_NORMAL_PRIORITY_CLASS);

    ix::initNetSystem();
    LOG_INFO("winsock initialization completed");

    const auto formatted_address = std::format("ws://{}:22006/cs2_webradar", config_data.m_ip);

    static ix::WebSocket web_socket;
    std::mutex handshake_mutex;
    std::condition_variable handshake_cv;
    bool connected = false;
    bool failed = false;

    web_socket.setUrl(formatted_address);
    web_socket.setOnMessageCallback([&](const ix::WebSocketMessagePtr& msg)
    {
        if (msg->type == ix::WebSocketMessageType::Open)
        {
            {
                std::lock_guard lock(handshake_mutex);
                connected = true;
            }
            handshake_cv.notify_one();
            LOG_INFO("connected to the web socket ('%s')", formatted_address.c_str());
        }
        else if (msg->type == ix::WebSocketMessageType::Message)
        {
            try
            {
                auto parsed = nlohmann::json::parse(msg->str);
                if (parsed.contains("delay_ms"))
                {
                    int new_delay = parsed["delay_ms"].get<int>();
                    if (new_delay >= 5 && new_delay <= 200)
                    {
                        g_update_delay_ms.store(new_delay);
                        LOG_INFO("dynamic update delay changed to %d ms", new_delay);
                    }
                }
            }
            catch (...) {}
        }
        else if (msg->type == ix::WebSocketMessageType::Error)
        {
            {
                std::lock_guard lock(handshake_mutex);
                failed = true;
            }
            handshake_cv.notify_one();
            LOG_ERROR("failed to connect to the web socket ('%s')", formatted_address.c_str());
        }
    });
    web_socket.start();

    {
        std::unique_lock lock(handshake_mutex);
        handshake_cv.wait(lock, [&] { return connected || failed; });
    }

    if (!connected)
    {
        std::this_thread::sleep_for(std::chrono::seconds(5));
        return {};
    }

    for (;;)
    {
        sdk::update();
        f::run();
        web_socket.send(f::m_data.dump());

        int current_delay = g_update_delay_ms.load();
        std::this_thread::sleep_for(std::chrono::milliseconds(current_delay));
    }

    return true;
}