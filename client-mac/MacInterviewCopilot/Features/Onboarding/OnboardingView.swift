import SwiftUI
import OpenAPIClient

/// Onboarding view for new users / non-logged-in state
struct OnboardingView: View {
    @EnvironmentObject var appState: AppState
    
    @State private var email = ""
    @State private var password = ""
    @State private var fullName = ""
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var isSignUp = false
    
    var body: some View {
        VStack(spacing: 20) {
            // Logo
            Image(systemName: "brain.head.profile")
                .font(.system(size: 48))
                .foregroundColor(.cyan)
            
            Text("Interview Copilot")
                .font(.title)
                .fontWeight(.bold)
                .foregroundColor(.white)
            
            Text(isSignUp ? "Create your account" : "Sign in to continue")
                .foregroundColor(.secondary)
            
            // Form
            VStack(spacing: 12) {
                if isSignUp {
                    TextField("Full Name", text: $fullName)
                        .textFieldStyle(.roundedBorder)
                }
                
                TextField("Email", text: $email)
                    .textFieldStyle(.roundedBorder)
                
                SecureField("Password", text: $password)
                    .textFieldStyle(.roundedBorder)
            }
            .padding(.horizontal, 40)
            
            // Error message
            if let error = errorMessage {
                Text(error)
                    .foregroundColor(.red)
                    .font(.caption)
            }
            
            // Sign in / Sign up button
            Button(action: { submit() }) {
                if isLoading {
                    ProgressView()
                        .controlSize(.small)
                } else {
                    Text(isSignUp ? "Sign Up" : "Sign In")
                        .frame(maxWidth: .infinity)
                }
            }
            .frame(width: 200)
            .buttonStyle(.borderedProminent)
            .disabled(isLoading || email.isEmpty || password.isEmpty)
            
            // Toggle mode
            Button(action: { isSignUp.toggle() }) {
                Text(isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .buttonStyle(.plain)
        }
        .padding(40)
    }
    
    private func submit() {
        isLoading = true
        errorMessage = nil
        
        // For now, fake login for development
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            let fakeUser = UserProfile(
                id: "dev-user",
                email: email,
                fullName: fullName.isEmpty ? "Dev User" : fullName,
                preferences: UserProfilePreferences()
            )
            appState.login(accessToken: "dev-token-\(UUID().uuidString)", user: fakeUser)
            isLoading = false
        }
    }
}
