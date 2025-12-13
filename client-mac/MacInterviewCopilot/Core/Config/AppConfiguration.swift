import Foundation

/// Application configuration singleton
public class AppConfiguration: ObservableObject {
    public static let shared = AppConfiguration()
    
    /// Backend API base URL
    public var apiBaseURL: String = "http://localhost:3000/v1"
    
    /// API version
    public let apiVersion: String = "v1"
    
    /// Use direct Ollama connection (offline mode)
    @Published public var useDirectOllama: Bool = false
    
    /// Auth Token
    @Published public var authToken: String? = "dev_token_123" // Hardcoded dev token for MVP
    
    private init() {
        // Load from environment or defaults
        if let envURL = ProcessInfo.processInfo.environment["API_BASE_URL"] {
            apiBaseURL = envURL
        }
        if let token = ProcessInfo.processInfo.environment["API_TOKEN"] {
            authToken = token
        }
    }
}
