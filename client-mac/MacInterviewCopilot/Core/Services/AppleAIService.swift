import Foundation
import NaturalLanguage

/// On-device AI service using Apple frameworks (NaturalLanguage, etc.)
@MainActor
public class AppleAIService {
    public static let shared = AppleAIService()
    
    private init() {}
    
    /// Question type classification
    public enum QuestionType: String, CaseIterable {
        case behavioral
        case coding
        case systemDesign
        case caseInterview
        case general
    }
    
    /// Sentiment analysis result
    public struct SentimentResult {
        public let score: Double
        public let label: String
    }
    
    /// Analyze sentiment of text using NLTagger
    public func analyzeSentiment(_ text: String) -> SentimentResult {
        let tagger = NLTagger(tagSchemes: [.sentimentScore])
        tagger.string = text
        
        let (sentiment, _) = tagger.tag(at: text.startIndex, unit: .paragraph, scheme: .sentimentScore)
        let score = Double(sentiment?.rawValue ?? "0") ?? 0
        
        let label: String
        if score > 0.1 {
            label = "Positive"
        } else if score < -0.1 {
            label = "Negative"
        } else {
            label = "Neutral"
        }
        
        return SentimentResult(score: score, label: label)
    }
    
    /// Identify the type of interview question
    public func identifyQuestionType(_ text: String) -> QuestionType {
        let lower = text.lowercased()
        
        if lower.contains("tell me about a time") || lower.contains("describe a situation") || 
           lower.contains("give me an example") || lower.contains("conflict") {
            return .behavioral
        } else if lower.contains("design") && (lower.contains("system") || lower.contains("scalable") || lower.contains("architecture")) {
            return .systemDesign
        } else if lower.contains("code") || lower.contains("algorithm") || lower.contains("implement") || lower.contains("function") {
            return .coding
        } else if lower.contains("case") || lower.contains("client") || lower.contains("revenue") || lower.contains("market") {
            return .caseInterview
        } else {
            return .general
        }
    }
    
    /// Suggest a framework for answering the question type
    public func suggestFramework(for type: QuestionType) -> String {
        switch type {
        case .behavioral:
            return "Use the STAR method: Situation, Task, Action, Result"
        case .coding:
            return "Clarify inputs/outputs → Brute force → Optimize → Code → Test"
        case .systemDesign:
            return "Requirements → High-level design → Deep dive → Trade-offs"
        case .caseInterview:
            return "Use MECE framework: Mutually Exclusive, Collectively Exhaustive"
        case .general:
            return "Structure your answer: Context → Main points → Conclusion"
        }
    }
}
