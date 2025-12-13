# BehavioralAPI

All URIs are relative to *http://localhost:3000/v1*

Method | HTTP request | Description
------------- | ------------- | -------------
[**behavioralAnswerPost**](BehavioralAPI.md#behavioralanswerpost) | **POST** /behavioral/answer | Get behavioral coaching (Streamed)


# **behavioralAnswerPost**
```swift
    open class func behavioralAnswerPost(behavioralStreamRequest: BehavioralStreamRequest, completion: @escaping (_ data: String?, _ error: Error?) -> Void)
```

Get behavioral coaching (Streamed)

Returns text/event-stream with chunks of feedback and improved answer.

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import OpenAPIClient

let behavioralStreamRequest = BehavioralStreamRequest(question: "question_example", context: "context_example", provider: "provider_example", sessionId: "sessionId_example") // BehavioralStreamRequest | 

// Get behavioral coaching (Streamed)
BehavioralAPI.behavioralAnswerPost(behavioralStreamRequest: behavioralStreamRequest) { (response, error) in
    guard error == nil else {
        print(error)
        return
    }

    if (response) {
        dump(response)
    }
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **behavioralStreamRequest** | [**BehavioralStreamRequest**](BehavioralStreamRequest.md) |  | 

### Return type

**String**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: text/event-stream

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

