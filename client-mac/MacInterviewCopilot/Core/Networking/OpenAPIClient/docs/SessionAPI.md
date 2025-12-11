# SessionAPI

All URIs are relative to *http://localhost:3000/v1*

Method | HTTP request | Description
------------- | ------------- | -------------
[**sessionsGet**](SessionAPI.md#sessionsget) | **GET** /sessions | List past sessions
[**sessionsIdMessagesGet**](SessionAPI.md#sessionsidmessagesget) | **GET** /sessions/{id}/messages | Get session messages
[**sessionsPost**](SessionAPI.md#sessionspost) | **POST** /sessions | Start a new session


# **sessionsGet**
```swift
    open class func sessionsGet(completion: @escaping (_ data: [Session]?, _ error: Error?) -> Void)
```

List past sessions

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import OpenAPIClient


// List past sessions
SessionAPI.sessionsGet() { (response, error) in
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
This endpoint does not need any parameter.

### Return type

[**[Session]**](Session.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **sessionsIdMessagesGet**
```swift
    open class func sessionsIdMessagesGet(id: String, completion: @escaping (_ data: [SessionsIdMessagesGet200ResponseInner]?, _ error: Error?) -> Void)
```

Get session messages

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import OpenAPIClient

let id = "id_example" // String | 

// Get session messages
SessionAPI.sessionsIdMessagesGet(id: id) { (response, error) in
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
 **id** | **String** |  | 

### Return type

[**[SessionsIdMessagesGet200ResponseInner]**](SessionsIdMessagesGet200ResponseInner.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **sessionsPost**
```swift
    open class func sessionsPost(sessionsPostRequest: SessionsPostRequest? = nil, completion: @escaping (_ data: Session?, _ error: Error?) -> Void)
```

Start a new session

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import OpenAPIClient

let sessionsPostRequest = _sessions_post_request(title: "title_example", type: "type_example") // SessionsPostRequest |  (optional)

// Start a new session
SessionAPI.sessionsPost(sessionsPostRequest: sessionsPostRequest) { (response, error) in
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
 **sessionsPostRequest** | [**SessionsPostRequest**](SessionsPostRequest.md) |  | [optional] 

### Return type

[**Session**](Session.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

