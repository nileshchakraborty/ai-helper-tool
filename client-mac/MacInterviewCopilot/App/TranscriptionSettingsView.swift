import SwiftUI

public struct TranscriptionSettingsView: View {
    @ObservedObject var settings = TranscriptionSettings.shared
    @Environment(\.dismiss) var dismiss
    
    public init() {}
    
    public var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header
            HStack {
                Text("Transcription Settings")
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
                // Sidebar (Providers)
                VStack(alignment: .leading, spacing: 4) {
                    Text("PROVIDER")
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
                                    Image(systemName: "checkmark")
                                        .font(.caption)
                                }
                            }
                            .padding(.vertical, 8)
                            .padding(.horizontal, 12)
                            .background(settings.provider == provider ? Color.blue.opacity(0.2) : Color.clear)
                            .foregroundColor(settings.provider == provider ? .blue : .white)
                            .cornerRadius(6)
                        }
                        .buttonStyle(.plain)
                    }
                    
                    Spacer()
                }
                .padding()
                .frame(width: 200)
                .background(Color.black.opacity(0.2))
                
                Divider()
                    .background(Color.white.opacity(0.1))
                
                // Content Area
                ScrollView {
                    VStack(alignment: .leading, spacing: 20) {
                        // Description Title
                        HStack {
                            Image(systemName: providerIcon(for: settings.provider))
                                .font(.title3)
                                .foregroundColor(.blue)
                            Text(settings.provider.rawValue)
                                .font(.title3)
                                .fontWeight(.medium)
                        }
                        
                        Text(settings.provider.description)
                            .font(.system(size: 13))
                            .foregroundColor(.gray)
                            .fixedSize(horizontal: false, vertical: true)
                        
                        Divider()
                            .background(Color.white.opacity(0.1))
                        
                        // Provider configuration
                        providerConfiguration(for: settings.provider)
                        
                        Spacer()
                    }
                    .padding(20)
                }
            }
            
            // Footer
            HStack {
                Spacer()
                Button("Done") {
                    dismiss()
                }
                .keyboardShortcut(.defaultAction)
                .padding(.horizontal, 20)
                .padding(.vertical, 8)
                .background(Color.blue)
                .foregroundColor(.white)
                .cornerRadius(8)
            }
            .padding(16)
            .background(Color.black.opacity(0.4))
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
