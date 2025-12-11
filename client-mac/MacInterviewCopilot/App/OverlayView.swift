import SwiftUI

struct OverlayView: View {
    @EnvironmentObject var appState: AppState
    
    var body: some View {
        ZStack {
            VisualEffectView(material: .hudWindow, blendingMode: .behindWindow)
                .edgesIgnoringSafeArea(.all)
            
            if appState.isLoggedIn {
                AuthContentView()
            } else {
                OnboardingView()
            }
        }
    }
}

struct AuthContentView: View {
    @EnvironmentObject var appState: AppState
    
    var body: some View {
        VStack {
            HStack {
                Text("Mac Interview Copilot")
                    .font(.headline)
                Spacer()
                Button("Log Out") {
                    appState.logout()
                }
            }
            .padding()
            
            ChatView()
            Spacer()
        }
    }
}

// Helper for blur effect
struct VisualEffectView: NSViewRepresentable {
    var material: NSVisualEffectView.Material
    var blendingMode: NSVisualEffectView.BlendingMode
    
    func makeNSView(context: Context) -> NSVisualEffectView {
        let view = NSVisualEffectView()
        view.material = material
        view.blendingMode = blendingMode
        view.state = .active
        return view
    }
    
    func updateNSView(_ nsView: NSVisualEffectView, context: Context) {
        nsView.material = material
        nsView.blendingMode = blendingMode
    }
}
