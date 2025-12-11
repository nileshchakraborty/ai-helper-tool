import Foundation
import SwiftUI
import Combine
import OpenAPIClient

class AppState: ObservableObject {
    @Published var isLoggedIn: Bool = false
    @Published var currentSessionId: String? = nil
    @Published var userProfile: UserProfile? = nil
    
    static let shared = AppState()
    
    private init() {
        checkLoginStatus()
    }
    
    func checkLoginStatus() {
        if let token = KeychainService.shared.getAccessToken() {
            // Verify token validity or refresh? 
            // For MVP, just assume valid if present. 
            // Better: Perform a /profile check
            self.isLoggedIn = true
            fetchProfile()
        } else {
            self.isLoggedIn = false
        }
    }
    
    func login(accessToken: String, user: UserProfile) {
        KeychainService.shared.saveAccessToken(accessToken)
        self.isLoggedIn = true
        self.userProfile = user
    }
    
    func logout() {
        KeychainService.shared.deleteAccessToken()
        self.isLoggedIn = false
        self.userProfile = nil
        self.currentSessionId = nil
    }
    
    private func fetchProfile() {
        // TODO: Call APIClient.shared.profile to get user details
        // Since we are using Generated Client, we need to bridge it or use direct URLSession if Generated Client is complex
        // But we have APIClient.swift... let's see what it wraps.
    }
}
