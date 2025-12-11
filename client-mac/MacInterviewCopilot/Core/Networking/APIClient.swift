import Foundation
import OpenAPIClient

class APIClient: ObservableObject {
    static let shared = APIClient()
    
    private init() {
        // Configure base path
        OpenAPIClientAPI.basePath = AppConfiguration.shared.apiBaseURL
    }
    
    func setAuthToken(_ token: String) {
        OpenAPIClientAPI.customHeaders["Authorization"] = "Bearer \(token)"
    }
    
    // Wrapper methods can go here, or usage can be direct via OpenAPIClientAPI
    // But setting headers centrally is key.
}
