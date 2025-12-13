import Foundation
import NaturalLanguage
import SwiftUI

/// Apple on-device AI service for privacy-preserving text analysis
/// Uses Apple's Natural Language framework - runs entirely on-device
@MainActor
public class AppleAIService: ObservableObject {
    public static let shared = AppleAIService()
    
    @Published public var isProcessing = false
    @Published public var lastResult: AIAnalysisResult?
    @Published public var error: String?
    
    private init() {}
    
    // MARK: - Quick Analysis
    
    /// Analyze text and extract key information (on-device, private)
    public func analyzeText(_ text: String) -> AIAnalysisResult {
        isProcessing = true
        defer { isProcessing = false }
        
        let result = AIAnalysisResult(
            sentiment: analyzeSentiment(text),
            keywords: extractKeywords(text),
            entities: extractEntities(text),
            language: detectLanguage(text),
            summary: generateQuickSummary(text)
        )
        
        lastResult = result
        return result
    }
    
    // MARK: - Sentiment Analysis
    
    /// Analyze sentiment of text (positive/negative/neutral)
    public func analyzeSentiment(_ text: String) -> SentimentResult {
        let tagger = NLTagger(tagSchemes: [.sentimentScore])
        tagger.string = text
        
        let (sentiment, _) = tagger.tag(at: text.startIndex, unit: .paragraph, scheme: .sentimentScore)
        
        if let sentimentValue = sentiment?.rawValue, let score = Double(sentimentValue) {
            if score > 0.1 {
                return SentimentResult(label: "Positive", score: score, emoji: "😊")
            } else if score < -0.1 {
                return SentimentResult(label: "Negative", score: score, emoji: "😟")
            } else {
                return SentimentResult(label: "Neutral", score: score, emoji: "😐")
            }
        }
        
        return SentimentResult(label: "Unknown", score: 0, emoji: "🤔")
    }
    
    // MARK: - Keyword Extraction
    
    /// Extract important keywords from text
    public func extractKeywords(_ text: String, maxKeywords: Int = 5) -> [String] {
        let tagger = NLTagger(tagSchemes: [.lexicalClass])
        tagger.string = text
        
        var wordCounts: [String: Int] = [:]
        
        tagger.enumerateTags(in: text.startIndex..<text.endIndex, unit: .word, scheme: .lexicalClass) { tag, tokenRange in
            if let tag = tag {
                // Focus on nouns, verbs, and adjectives
                if tag == .noun || tag == .verb || tag == .adjective {
                    let word = String(text[tokenRange]).lowercased()
                    if word.count > 3 { // Skip short words
                        wordCounts[word, default: 0] += 1
                    }
                }
            }
            return true
        }
        
        return wordCounts
            .sorted { $0.value > $1.value }
            .prefix(maxKeywords)
            .map { $0.key }
    }
    
    // MARK: - Named Entity Recognition
    
    /// Extract named entities (people, places, organizations)
    public func extractEntities(_ text: String) -> [NamedEntity] {
        let tagger = NLTagger(tagSchemes: [.nameType])
        tagger.string = text
        
        var entities: [NamedEntity] = []
        
        tagger.enumerateTags(in: text.startIndex..<text.endIndex, unit: .word, scheme: .nameType, options: [.joinNames]) { tag, tokenRange in
            if let tag = tag {
                let entity = NamedEntity(
                    text: String(text[tokenRange]),
                    type: entityType(from: tag)
                )
                if !entities.contains(where: { $0.text == entity.text }) {
                    entities.append(entity)
                }
            }
            return true
        }
        
        return entities
    }
    
    private func entityType(from tag: NLTag) -> String {
        switch tag {
        case .personalName: return "Person"
        case .placeName: return "Place"
        case .organizationName: return "Organization"
        default: return "Other"
        }
    }
    
    // MARK: - Language Detection
    
    /// Detect language of text
    public func detectLanguage(_ text: String) -> String {
        let recognizer = NLLanguageRecognizer()
        recognizer.processString(text)
        
        if let language = recognizer.dominantLanguage {
            return Locale.current.localizedString(forLanguageCode: language.rawValue) ?? language.rawValue
        }
        
        return "Unknown"
    }
    
    // MARK: - Quick Summary
    
    /// Generate a quick summary by extracting key sentences
    public func generateQuickSummary(_ text: String, maxSentences: Int = 2) -> String {
        let tokenizer = NLTokenizer(unit: .sentence)
        tokenizer.string = text
        
        var sentences: [String] = []
        tokenizer.enumerateTokens(in: text.startIndex..<text.endIndex) { tokenRange, _ in
            sentences.append(String(text[tokenRange]))
            return true
        }
        
        // Return first N sentences as summary
        // In a more sophisticated version, we'd rank by importance
        return sentences.prefix(maxSentences).joined(separator: " ")
    }
    
    // MARK: - Interview-Specific Helpers
    
    /// Identify the type of interview question
    public func identifyQuestionType(_ question: String) -> QuestionType {
        let lowercased = question.lowercased()
        
        if lowercased.contains("tell me about a time") || lowercased.contains("describe a situation") ||
           lowercased.contains("give me an example") {
            return .behavioral
        } else if lowercased.contains("how would you design") || lowercased.contains("architect") {
            return .systemDesign
        } else if lowercased.contains("what is") || lowercased.contains("explain") || 
                  lowercased.contains("difference between") {
            return .technical
        } else if lowercased.contains("why") && (lowercased.contains("company") || lowercased.contains("role")) {
            return .motivational
        } else if lowercased.contains("strength") || lowercased.contains("weakness") {
            return .selfAssessment
        } else if lowercased.contains("market") || lowercased.contains("profit") || 
                  lowercased.contains("revenue") || lowercased.contains("client") {
            return .caseInterview
        }
        
        return .general
    }
    
    /// Suggest response framework based on question type
    public func suggestFramework(for questionType: QuestionType) -> String {
        switch questionType {
        case .behavioral:
            return "Use STAR: Situation → Task → Action → Result"
        case .systemDesign:
            return "Use: Requirements → High-level Design → Deep Dive → Trade-offs"
        case .technical:
            return "Use: Clarify → Explain Concept → Give Example → Common Pitfalls"
        case .motivational:
            return "Use: Research + Personal Connection + Future Goals"
        case .selfAssessment:
            return "Use: Honest Assessment + Specific Example + Growth Mindset"
        case .caseInterview:
            return "Use: Clarify → Framework (MECE) → Analyze → Recommend"
        case .general:
            return "Be concise, specific, and give examples"
        }
    }
}

// MARK: - Data Models

public struct AIAnalysisResult {
    public let sentiment: SentimentResult
    public let keywords: [String]
    public let entities: [NamedEntity]
    public let language: String
    public let summary: String
}

public struct SentimentResult {
    public let label: String
    public let score: Double
    public let emoji: String
}

public struct NamedEntity: Identifiable {
    public let id = UUID()
    public let text: String
    public let type: String
}

public enum QuestionType: String {
    case behavioral = "Behavioral"
    case systemDesign = "System Design"
    case technical = "Technical"
    case motivational = "Motivational"
    case selfAssessment = "Self-Assessment"
    case caseInterview = "Case Interview"
    case general = "General"
}

// MARK: - Quick Analysis View

public struct QuickAnalysisView: View {
    @StateObject private var aiService = AppleAIService.shared
    let text: String
    
    public init(text: String) {
        self.text = text
    }
    
    public var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            if let result = aiService.lastResult {
                HStack(spacing: 12) {
                    // Sentiment
                    HStack(spacing: 4) {
                        Text(result.sentiment.emoji)
                        Text(result.sentiment.label)
                            .font(.caption2)
                    }
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.black.opacity(0.3))
                    .cornerRadius(4)
                    
                    // Question type
                    let questionType = aiService.identifyQuestionType(text)
                    Text(questionType.rawValue)
                        .font(.caption2)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.cyan.opacity(0.3))
                        .cornerRadius(4)
                }
                
                // Keywords
                if !result.keywords.isEmpty {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 4) {
                            Text("Keywords:")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                            ForEach(result.keywords, id: \.self) { keyword in
                                Text(keyword)
                                    .font(.caption2)
                                    .padding(.horizontal, 6)
                                    .padding(.vertical, 2)
                                    .background(Color.purple.opacity(0.2))
                                    .cornerRadius(4)
                            }
                        }
                    }
                }
                
                // Framework suggestion
                let questionType = aiService.identifyQuestionType(text)
                Text(aiService.suggestFramework(for: questionType))
                    .font(.caption)
                    .foregroundColor(.green)
                    .italic()
            }
        }
        .onAppear {
            _ = aiService.analyzeText(text)
        }
    }
}

// MARK: - Provider Option

extension TranscriptionProvider {
    static var appleAI: TranscriptionProvider { .appleSpeech }
}
