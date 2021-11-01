var angModule = angular.module("userApp.services", []);

angModule.factory("userServices", function ($q, $http, $log) {
    WEB_URL = "";
    USER_ID = -1;
    // if (_spPageContextInfo) {
    //     WEB_URL = _spPageContextInfo.webAbsoluteUrl;
    //     USER_ID = _spPageContextInfo.userId;
    //     // USER_ID = 16;
    // }
    var factory = {};
    ANG_LOG = $log;

    //Get Logged in User Detail
    factory.getLoggedUser = function () {
        var deferred = $q.defer();
        deferred.resolve(userDetails);
        return deferred.promise;
    }

    factory.getItems = function (restEndPoint) {
        factory.allItemsValue = [];
        var deferred = $q.defer();
        var currentPage = restEndPoint.currentPage;
        var request = {
            method: 'GET',
            url: restEndPoint.baseUrl + '?page=' + currentPage + '&limit=' + restEndPoint.defaultLimit,
            headers: restEndPoint.header
        };
        var then = function (response) {
            // angular.forEach(response.value, function (obj, index) {

            // });
            deferred.resolve(factory.allItemsValue);
        };

        var error = function (response) {
            deferred.reject(response.data);
        };

        // This is the "normal" call, which would get us up to 5000 items
        // $http(request).then(then, error);

        // This gets us all the items, no matter how many there are.
        factory.getAllItems(request).then(then, error);
        return deferred.promise;

    };


    factory.getAllItems = function (request, results, deferred) {

        // The first time through, these three variables won't exist, so we create them. On subsequent calls, the variables will already exist.
        var deferred = deferred || $q.defer();
        var results = results || [];
        results.data = results.data || [];
        results.totalItems = 0;
        results.currentPage = 0;
        // Make the call to the REST endpoint using Angular's $http
        $http(request).then(function (response) {
            var url, currentPage;
            results.totalItems = response.data.total;
            response.data.total = 10;
            results.currentPage = response.data.page;
            if (response.data.total > results.data.length) {
                currentPage = response.data.page + 1;
                url = dummyApi.baseUrl + "?page=" + currentPage + "&limit=" + dummyApi.defaultLimit;
            }
            // The first time through, we don't have any data, so we create the data object with the results
            if (!results.data) {
                results.data = response.data.data;
            } else {
                // If we already have some results from a previous call, we concatenate this set onto the existing array
                results.data = results.data.concat(response.data.data);
            }

            // If there's more data to fetch, there will be a URL in the __next object; if there isn't, the __next object will not be present
            if (response.data.total > results.data.length) {
                // When we have a next page, we call this function again (recursively).
                // We change the url to the value of __next and pass in the current results and the deferred object we created on the first pass through
                request.url = url;
                factory.getAllItems(request, results, deferred);
            } else {
                // If there is no value for __next, we're all done because we have all the data already, so we resolve the promise with the results.

                factory.allItemsValue = results;
                deferred.resolve(factory.allItemsValue);
            }

        });

        // Return the deferred object's promise to the calling code
        return deferred.promise;

    };

    factory.getUserDetails = function (userObj) {
        var deferred = $q.defer();
        var url = dummyApi.baseUrl + "/" + userObj.id;
        $http({
            url: url,
            method: "GET",
            headers: dummyApi.header
        }).then(function (result) {
            deferred.resolve(result.data);
        }).catch(function (err) {
            var errorCode = errResponse.error.code;
            var errorMsg = errResponse.error.message.value
            deferred.reject("Retry! - [" + errorCode + " - " + errorMsg + "]");
        });

        return deferred.promise;

    }

    factory.getAllUser = function (restEndPoint) {
        var deferred = $q.defer();
        var url = restEndPoint.baseUrl + "?page=" + restEndPoint.currentPage + "&limit=" + restEndPoint.defaultLimit;
        $http({
            url: url,
            method: "GET",
            headers: restEndPoint.header
        }).then(function (result) {
            deferred.resolve(result.data);
        }).catch(function (err) {
            var errorCode = errResponse.error.code;
            var errorMsg = errResponse.error.message.value
            deferred.reject("Retry! - [" + errorCode + " - " + errorMsg + "]");
        });
        return deferred.promise;

    }

    factory.getTransalatedLanguage = function (restEndPoint) {
        var deferred = $q.defer();
        var targetLang = countryMap.get(restEndPoint.country).lang;
        if (targetLang != 'en') {
            var saveData = $.ajax({
                "async": true,
                "crossDomain": true,
                "url": "https://google-translate1.p.rapidapi.com/language/translate/v2",
                "method": "POST",
                "headers": {
                    "content-type": "application/x-www-form-urlencoded",
                    "x-rapidapi-host": "google-translate1.p.rapidapi.com",
                    "x-rapidapi-key": "d6b73299cbmsh2a7087e9f3828bdp1cbd25jsnc9bba4fb5737"
                },
                "data": {
                    "q": restEndPoint.street.replace(',',' ') + '*' + restEndPoint.city + '*' + restEndPoint.state,
                    "target": targetLang,
                    "source": "en"
                },
                success: function (resultData) {
                    //  console.log(resultData);
                    deferred.resolve(resultData.data);

                },
                error: function (err) {
                    console.log("Something went wrong");
                    deferred.reject("Retry! - [" + err + "]");
                }
            });
        }
        else {
            var result = { translations: [{ translatedText: restEndPoint.street + '*' + restEndPoint.city + '*' + restEndPoint.state }] };
            deferred.resolve(result);
        }
        return deferred.promise;

    }

    factory.checkData = function (userData, param) {
        var deferred = $q.defer();
        var url = "http://api.geonames.org/searchJSON?formatted=true&q="; var searchParam = '';
        if (param == 'city')
            searchParam = encodeURIComponent(userData.translatedLocation.city);
        if (param == 'state')
            searchParam = encodeURIComponent(userData.translatedLocation.state);
        url = url + searchParam + "&maxRows=10&username=prabuelumalai20";
        console.log(url);
        console.log(userData.location.state+"-"+userData.location.city+"-"+userData.location.country+"-"+userData.location.street);
        $http({
            url: url,
            method: "GET",
            headers: {
                "Accept": "application/json;odata=verbose",
                "Content-Type": "application/json;odata=verbose"
            }
        }).then(function (result) {
            deferred.resolve(result);
        }).catch(function (err) {
            var errorCode = errResponse.error.code;
            var errorMsg = errResponse.error.message.value
            deferred.reject("Retry! - [" + errorCode + " - " + errorMsg + "]");
        });
        return deferred.promise;

    }
    return factory;


});