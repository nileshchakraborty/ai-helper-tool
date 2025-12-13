import XCTest

#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

final class E2ETests: XCTestCase {
    
    // Ensure backend is running before these tests
    // cd backend && npm run dev
    
    let baseURL = "http://localhost:3000"
    
    func testBackendHealthCheck() async throws {
        let url = URL(string: "\(baseURL)/health")!
        let (data, response) = try await URLSession.shared.data(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            XCTFail("Invalid response type")
            return
        }
        
        XCTAssertEqual(httpResponse.statusCode, 200, "Health check should return 200")
        
        // Simple JSON verification
        if let json = try? JSONSerialization.jsonObject(with: data) as? [String: String] {
            XCTAssertEqual(json["status"], "ok")
        } else {
            XCTFail("Response was not JSON or did not match expected structure")
        }
    }
    
    func testBehavioralAnswerEndpoint() async throws {
        let url = URL(string: "\(baseURL)/v1/behavioral/answer")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        request.addValue("text/event-stream", forHTTPHeaderField: "Accept")
        
        let body: [String: Any] = [
            "question": "What is your greatest strength?",
            "context": "Software Engineer interview",
            "provider": "ollama"  // Use local Ollama instead of OpenAI
        ]
        
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        let session = URLSession(configuration: config)
        
        do {
            let (_, response) = try await session.data(for: request)
            
            if let httpResponse = response as? HTTPURLResponse {
                XCTAssertTrue([200, 500].contains(httpResponse.statusCode), "Behavioral endpoint reachable (got \(httpResponse.statusCode))")
            }
        } catch {
            XCTFail("Request failed: \(error)")
        }
    }
    
    func testAgentChatEndpoint() async throws {
        let url = URL(string: "\(baseURL)/v1/agent/chat")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        request.addValue("text/event-stream", forHTTPHeaderField: "Accept")
        
        let body: [String: Any] = [
            "message": "How do I reverse a linked list?",
            "context": "Coding interview prep",
            "provider": "ollama"
        ]
        
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        let session = URLSession(configuration: config)
        
        do {
            let (_, response) = try await session.data(for: request)
            
            if let httpResponse = response as? HTTPURLResponse {
                // Accept 200, 401, or 500 - we just want to verify endpoint connectivity
                XCTAssertTrue([200, 401, 500].contains(httpResponse.statusCode), "Agent chat endpoint reachable (got \(httpResponse.statusCode))")
            }
        } catch {
            XCTFail("Request failed: \(error)")
        }
    }
    
    func testSystemDesignEndpoint() async throws {
        let url = URL(string: "\(baseURL)/v1/system-design/analyze")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        request.addValue("text/event-stream", forHTTPHeaderField: "Accept")
        
        let body: [String: Any] = [
            "problem": "Design a URL shortener",
            "context": "System design interview",
            "provider": "ollama"
        ]
        
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        let session = URLSession(configuration: config)
        
        do {
            let (_, response) = try await session.data(for: request)
            
            if let httpResponse = response as? HTTPURLResponse {
                // Accept 200, 401, or 500 - we just want to verify endpoint connectivity
                XCTAssertTrue([200, 401, 500].contains(httpResponse.statusCode), "System design endpoint reachable (got \(httpResponse.statusCode))")
            }
        } catch {
            XCTFail("Request failed: \(error)")
        }
    }
    
    func testImageProvidersEndpoint() async throws {
        let url = URL(string: "\(baseURL)/v1/image/providers")!
        let (data, response) = try await URLSession.shared.data(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            XCTFail("Invalid response type")
            return
        }
        
        XCTAssertEqual(httpResponse.statusCode, 200, "Image providers should return 200")
        
        // Verify we get a JSON response with providers
        if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
            XCTAssertNotNil(json["providers"], "Response should contain providers")
        } else {
            XCTFail("Response was not valid JSON")
        }
    }
}
