import SwiftUI
import OpenAPIClient

struct OnboardingView: View {
    @EnvironmentObject var appState: AppState
    @State private var email = ""
    @State private var password = ""
    @State private var fullName = ""
    @State private var isSignUp = false
    @State private var errorMessage: String?
    @State private var isLoading = false
    
    var body: some View {
        VStack(spacing: 20) {
            Text("Mac Interview Copilot")
                .font(.largeTitle)
                .fontWeight(.bold)
            
            Text(isSignUp ? "Create Account" : "Welcome Back")
                .font(.headline)
            
            TextField("Email", text: $email)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .frame(width: 300)
            
            SecureField("Password", text: $password)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .frame(width: 300)
            
            if isSignUp {
                TextField("Full Name", text: $fullName)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .frame(width: 300)
            }
            
            if let error = errorMessage {
                Text(error)
                    .foregroundColor(.red)
                    .font(.caption)
            }
            
            Button(action: performAuth) {
                if isLoading {
                    ProgressView()
                        .controlSize(.small)
                } else {
                    Text(isSignUp ? "Sign Up" : "Log In")
                }
            }
            .disabled(isLoading || email.isEmpty || password.isEmpty)
            
            Button(isSignUp ? "Already have an account? Log In" : "Need an account? Sign Up") {
                isSignUp.toggle()
                errorMessage = nil
            }
            .buttonStyle(.link)
        }
        .padding()
        .frame(width: 400, height: 400)
    }
    
    func performAuth() {
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                if isSignUp {
                    let request = SignUpRequest(email: email, password: password, fullName: fullName)
                    let response = try await authSignup(request: request)
                    if let token = response.accessToken, let user = response.user {
                        DispatchQueue.main.async {
                           appState.login(accessToken: token, user: user)
                        }
                    }
                } else {
                    let request = LoginRequest(email: email, password: password)
                    let response = try await authLogin(request: request)
                    if let token = response.accessToken, let user = response.user {
                         DispatchQueue.main.async {
                            appState.login(accessToken: token, user: user)
                         }
                    }
                }
            } catch {
                DispatchQueue.main.async {
                    errorMessage = "Authentication failed. Check credentials."
                    print("Auth error: \(error)")
                }
            }
            DispatchQueue.main.async {
                isLoading = false
            }
        }
    }
    
    // Async wrappers for callback-based generated API
    func authLogin(request: LoginRequest) async throws -> AuthResponse {
        return try await withCheckedThrowingContinuation { continuation in
            AuthAPI.authLoginPost(loginRequest: request) { result in
                switch result {
                case .success(let response):
                    continuation.resume(returning: response)
                case .failure(let error):
                    continuation.resume(throwing: error)
                }
            }
        }
    }
    
    func authSignup(request: SignUpRequest) async throws -> AuthResponse {
        return try await withCheckedThrowingContinuation { continuation in
            AuthAPI.authSignupPost(signUpRequest: request) { result in
                switch result {
                case .success(let response):
                    continuation.resume(returning: response)
                case .failure(let error):
                    continuation.resume(throwing: error)
                }
            }
        }
    }
}
