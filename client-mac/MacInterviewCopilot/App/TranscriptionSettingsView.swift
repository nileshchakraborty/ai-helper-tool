import SwiftUI

public struct TranscriptionSettingsView: View {
    @ObservedObject var settings = TranscriptionSettings.shared
    @ObservedObject var appState = AppState.shared
    @Environment(\.dismiss) var dismiss
    
    public init() {}
    
    public var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header
            // Header
            HStack {
                Text("Settings")
                    .font(.headline)
                    .foregroundColor(.white)
                 Spacer()
                Button(action: { dismiss() }) {
                    Image(systemName: "xmark.circle.fill")
                        .font(.system(size: 20))
                        .foregroundColor(.gray)
                }
                .buttonStyle(.plain)
            }
            .padding()
            .background(Color.black.opacity(0.4))
            
            Divider()
                .background(Color.white.opacity(0.1))
            
            HStack(spacing: 0) {
                // Sidebar
                VStack(alignment: .leading, spacing: 4) {
                    Text("AUDIO SOURCE")
                        .font(.caption2)
                        .fontWeight(.bold)
                        .foregroundColor(.gray)
                        .padding(.horizontal, 12)
                        .padding(.bottom, 8)
                    
                    ForEach(TranscriptionProvider.allCases, id: \.self) { provider in
                        Button(action: { settings.provider = provider }) {
                            HStack {
                                Image(systemName: providerIcon(for: provider))
                                    .frame(width: 20)
                                Text(provider.rawValue)
                                    .font(.system(size: 13))
                                Spacer()
                                if settings.provider == provider {
                                    Circle()
                                        .fill(Color.blue)
                                        .frame(width: 6, height: 6)
                                }
                            }
                            .padding(.vertical, 8)
                            .padding(.horizontal, 12)
                            .background(settings.provider == provider ? Color.white.opacity(0.1) : Color.clear)
                            .foregroundColor(settings.provider == provider ? .white : .gray)
                            .cornerRadius(8)
                        }
                        .buttonStyle(.plain)
                    }
                    
                    Spacer()
                    
                    Divider()
                        .background(Color.white.opacity(0.1))
                        .padding(.vertical, 8)
                    
                    // Appearance Section
                    VStack(alignment: .leading, spacing: 10) {
                        Label("Appearance", systemImage: "macwindow")
                             .font(.caption2)
                             .fontWeight(.bold)
                             .foregroundColor(.gray)
                        
                        HStack {
                            Image(systemName: "sun.min")
                                .font(.caption)
                                .foregroundColor(.gray)
                            Slider(value: $appState.windowOpacity, in: 0.2...1.0)
                                .tint(.white)
                            Image(systemName: "sun.max.fill")
                                .font(.caption)
                                .foregroundColor(.white)
                        }
                    }
                    .padding(.horizontal, 12)
                    .padding(.bottom, 12)
                }
                .padding(.vertical)
                .frame(width: 220)
                .background(Color.black.opacity(0.3))
                
                Divider()
                    .background(Color.white.opacity(0.1))
                
                // Content Area
                ScrollView {
                    VStack(alignment: .leading, spacing: 20) {
                        providerConfiguration(for: settings.provider)
                        Spacer()
                    }
                    .padding(24)
                }
            }
        }
        .frame(width: 600, height: 450)
        .background(Color(hex: "1E1E1E"))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.white.opacity(0.1), lineWidth: 1)
        )
    }
    
    private func providerIcon(for provider: TranscriptionProvider) -> String {
        switch provider {
        case .appleSpeech: return "mic.fill"
        case .whisperAPI: return "cloud.fill"
        case .whisperLocal: return "lock.shield.fill"
        case .manual: return "keyboard.fill"
        }
    }
    
    @ViewBuilder
    private func providerConfiguration(for provider: TranscriptionProvider) -> some View {
        switch provider {
        case .appleSpeech:
            VStack(alignment: .leading, spacing: 12) {
                Label("Requires Permissions", systemImage: "hand.raised.fill")
                    .font(.caption)
                    .foregroundColor(.orange)
                
                Text("• Microphone Access")
                Text("• Speech Recognition")
                
                Button("Check Permissions") {
                     TranscriptionService.shared.checkPermissionsIfNeeded()
                }
                .buttonStyle(.bordered)
            }
            
        case .whisperAPI:
            VStack(alignment: .leading, spacing: 10) {
                Text("OpenAI API Key")
                    .font(.headline)
                SecureField("sk-...", text: $settings.whisperAPIKey)
                    .textFieldStyle(.roundedBorder)
                
                Text("Model")
                    .font(.headline)
                TextField("whisper-1", text: $settings.whisperModel)
                    .textFieldStyle(.roundedBorder)
            }
            
        case .whisperLocal:
            VStack(alignment: .leading, spacing: 10) {
                Text("Model Path")
                    .font(.headline)
                Text("Support coming soon.")
                    .foregroundColor(.secondary)
            }
            
        case .manual:
            Text("No configuration needed.")
                .foregroundColor(.secondary)
        }
    }
}
