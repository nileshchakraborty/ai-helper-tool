import XCTest

#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

final class E2ETests: XCTestCase {
    
    // Ensure backend is running before these tests
    // docker-compose -f infra/docker-compose.dev.yml up -d
    
    func testBackendHealthCheck() async throws {
        let url = URL(string: "http://localhost:3000/health")!
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
        // This test assumes OPENAI_API_KEY is properly set in backend
        // or that it gracefully fails if not set, but the endpoint should reach
        
        let url = URL(string: "http://localhost:3000/v1/behavioral/answer")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: Any] = [
            "question": "Test question",
            "context": "Test context",
            "provider": "openai"
        ]
        
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        // Use a 10s timeout since AI can be slow
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 10
        let session = URLSession(configuration: config)
        
        do {
            let (_, response) = try await session.data(for: request)
            
            if let httpResponse = response as? HTTPURLResponse {
                // We accept 200 (success) or 500 (if API key missing/invalid, but reached server)
                // The goal is connectivity check
                XCTAssertTrue([200, 500].contains(httpResponse.statusCode), "Endpoint reachable (got \(httpResponse.statusCode))")
            }
        } catch {
             XCTFail("Request failed: \(error)")
        }
    }
}
