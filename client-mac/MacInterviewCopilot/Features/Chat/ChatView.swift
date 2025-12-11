import SwiftUI
import OpenAPIClient

struct ChatView: View {
    @EnvironmentObject var appState: AppState
    @State private var question = ""
    @State private var context = ""
    @State private var messages: [ChatMessage] = []
    @State private var isStreaming = false
    @State private var currentResponse = ""
    
    struct ChatMessage: Identifiable {
        let id = UUID()
        let role: String // "user" or "assistant"
        let content: String
    }
    
    var body: some View {
        VStack {
            ScrollViewReader { proxy in
                ScrollView {
                    VStack(alignment: .leading, spacing: 10) {
                        ForEach(messages) { msg in
                            HStack {
                                if msg.role == "user" {
                                    Spacer()
                                    Text(msg.content)
                                        .padding()
                                        .background(Color.blue)
                                        .foregroundColor(.white)
                                        .cornerRadius(8)
                                } else {
                                    Text(msg.content)
                                        .padding()
                                        .background(Color.gray.opacity(0.2))
                                        .cornerRadius(8)
                                    Spacer()
                                }
                            }
                        }
                        
                        if !currentResponse.isEmpty {
                            HStack {
                                Text(currentResponse)
                                    .padding()
                                    .background(Color.gray.opacity(0.2))
                                    .cornerRadius(8)
                                Spacer()
                            }
                        }
                    }
                    .padding()
                    .onChange(of: messages.count) { _ in
                        scrollToBottom(proxy)
                    }
                    .onChange(of: currentResponse) { _ in
                         scrollToBottom(proxy)
                    }
                }
            }
            
            Divider()
            
            VStack(spacing: 8) {
                TextEditor(text: $context)
                    .frame(height: 60)
                    .overlay(RoundedRectangle(cornerRadius: 4).stroke(Color.gray.opacity(0.5)))
                    .overlay(Text("Context/Job Description").foregroundColor(.gray).opacity(context.isEmpty ? 0.5 : 0).padding(4), alignment: .topLeading)
                
                HStack {
                    TextField("Enter your question...", text: $question)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                    
                    Button(action: captureScreen) {
                        Image(systemName: "camera.viewfinder")
                    }
                    .help("Capture Screen & OCR")
                    
                    Button("Ask") {
                        sendMessage()
                    }
                    .disabled(question.isEmpty || isStreaming)
                }
            }
            .padding()
        }
    }
    
    private func scrollToBottom(_ proxy: ScrollViewProxy) {
        if let last = messages.last {
            proxy.scrollTo(last.id, anchor: .bottom)
        }
    }
    
    func sendMessage() {
        let q = question
        let c = context
        question = "" // Clear input
        
        messages.append(ChatMessage(role: "user", content: q))
        isStreaming = true
        currentResponse = ""
        
        Task {
            do {
                // Ensure session exists or rely on backend to create (we modified routes to use sessionId optional)
                // If we want history, we should create session first. 
                // For MVP, just send.
                // TODO: Wire up sessionId from AppState
                
                let stream = StreamingClient.shared.streamBehavioralAnswer(question: q, context: c, sessionId: appState.currentSessionId)
                
                for try await chunk in stream {
                    DispatchQueue.main.async {
                        currentResponse += chunk
                    }
                }
                
                DispatchQueue.main.async {
                    messages.append(ChatMessage(role: "assistant", content: currentResponse))
                    currentResponse = ""
                    isStreaming = false
                }
            } catch {
                DispatchQueue.main.async {
                    messages.append(ChatMessage(role: "system", content: "Error: \(error.localizedDescription)"))
                    isStreaming = false
                }
            }
        }
    }
}
