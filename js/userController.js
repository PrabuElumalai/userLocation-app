var navigatorObj = window.navigator;
var angM = angular.module('userApp.controller', ['ngSanitize', 'ngAnimate']);

angM.directive('loading', function () {
    return {
        restrict: 'E',
        replace: true,
        template:
            '<div class="pt-2 loadingDiv"><div class="loadingDivChild text-center"><i ng-class="{\'fas fa-6x fa-spin fa-spinner loadingSpinner\': !pageError, \'fa fa-3x fa-exclamation-triangle text-danger\': pageError}"></i><div class="loadingMsgCss pt-2"><span ng-if="!pageError">Your request is being processed... Please be patient...<span class="pt-1"><br/>{{loadingMsg}}<br/>{{loadingMsgSub}}</span></span><span ng-if="pageError" class="text-danger">Oops, something went wrong. Please retry<br/>If the issue persists, please contact System Admin with screenshot.<br/><ul class="text-left ml-5 text-small"><li ng-repeat="errMsg in pageErrorResponse">{{errMsg}}</li></ul></span></div><div class="text-center" ng-if="pageError"><button type="button" class="btn btn-secondary ml-2" ng-click="openPage(\'HOME\')"><span class="fa fa-reply text-light"></span>&nbsp;Go Back</button></div></div></div>',
        link: function (scope, element, attr) {
            scope.$watch('loading', function (val) {
                if (val) $(element).show();
                else $(element).hide();
            });
        }
    };
});

angM.filter('capitalize', function () {
    return function (input) {
        return (angular.isString(input) && input.length > 0) ? input.charAt(0).toUpperCase() + input.substr(1).toLowerCase() : input;
    }
});


angM.controller('userController', function ($scope, $q, $log, userServices) {//,$filter, $locale,  $window, $timeout, $sce,

    // SharePoint Variables
    $scope.pageDetails = {
        url: window.location.href,
        pageName: window.location.href.substring(window.location.href.lastIndexOf("/") + 1).toUpperCase()
    }
    $scope.loggedUser = {};

    // Global Variables
    $scope.loading = false;
    $scope.loadingMsg = "";
    $scope.loadingMsgSub = "";
    $scope.pageError = false;
    $scope.validationError = false;
    $scope.pageErrorResponse = [];
    $scope.deferChain = [];
    $scope.currentYear = new Date().getFullYear();
    $scope.logData = true;
    $scope.allUsers = [];
    $scope.reportUsers = [];
    $scope.userDetails = {
        data: [],
        totalData: 0,
        currentPage: 0,
        defaultLimit: 10
    };
    var allUsersData = [];
    $scope.loadMoreFlag = false;

    //Browser Properties
    $scope.pageData = {};
    $scope.pageData['browserCode'] = navigatorObj.appCodeName;
    $scope.pageData['browserName'] = navigatorObj.appName;
    $scope.pageData['browserVersion'] = navigatorObj.appVersion;
    $scope.pageData['platForm'] = navigatorObj.platform;
    $scope.pageData['userAgent'] = navigatorObj.userAgent;
    $scope.pageData['browserVendor'] = navigatorObj.vendor;
    $scope.pageData['screenWidth'] = '' + window.screen.width;
    $scope.pageData['screenHeight'] = '' + window.screen.height;
    $scope.pageData['loginName'] = 'Prabu Elumalai'; // replace with the code to get logged user details
    $scope.pageData['pageUrl'] = window.location.href;

    $scope.logAction = function (action, data) {
        console.log(action);
        console.log(data);
    }

    $scope.startLoading = function (withMessage) {
        $scope.loading = true;
        $scope.loadingMsg = withMessage;
    }

    $scope.endLoading = function () {
        $q.all($scope.deferChain).then(
            function (results) {
                angular.forEach(results, function (varResponse, index) {
                    $log.info(varResponse);
                });
                $log.log('99 - COMPLETE Loading - ' + results);
                cleanUpLoading();
            },
            function (error) {
                $log.error('99 - FAILED - ' + error);
                cleanUpLoading();
            }
        );
    }

    $scope.getLoggedUserProfile = function () {
        var defer = $q.defer();
        var deferPromise = defer.promise;
        $scope.deferChain.push(deferPromise);

        userServices.getLoggedUser().then(function (results) {
            $scope.loggedUser = results;
            defer.resolve("COMPLETE - User Info ");

        }).catch(function (err) {
            handleErrMsg(err, "getLoggedUser");
            defer.reject(err);
        });

        return deferPromise;
    };

    $scope.getAllUsers = function () {
        var defer = $q.defer();
        var deferPromise = defer.promise;
        $scope.deferChain.push(deferPromise);
        var restEndPoint = dummyApi;
        if ($scope.userDetails.data.length > 0) {
            restEndPoint.currentPage = $scope.userDetails.currentPage + 1;
        }
        userServices.getAllUser(restEndPoint).then(function (results) {
            $scope.userDetails.data = results.data;
            $scope.userDetails.totalData = results.total;
            $scope.userDetails.currentPage = results.page;
            defer.resolve("COMPLETE - User Info ");

        }).catch(function (err) {
            handleErrMsg(err, "getLoggedUser");
            defer.reject(err);
        });
        return deferPromise;
    };


    $scope.getAllUserDetails = function () {
        var defer = $q.defer();
        var deferPromise = defer.promise;
        $scope.deferChain.push(deferPromise);
        var userData = angular.copy($scope.userDetails.data);
        allUsersData = [];
        var chain = $q.when();
        angular.forEach(userData, function (userObj, index) {
            chain = chain.then(function () {
                return userServices.getUserDetails(userObj).then(function (userResults) {
                    allUsersData.push(userResults);
                    if (userData.length == (index + 1)) {
                        defer.resolve("COMPLETE - Got Complete User Details ");
                    }
                }).catch(function (errResponse) {
                    $scope.pageError = true;
                    $scope.pageErrorResponse = errResponse;
                    defer.reject(errResponse);
                });
            });
        });
        return deferPromise;
    };
    $scope.translate = function () {
        var defer = $q.defer();
        var deferPromise = defer.promise;
        $scope.deferChain.push(deferPromise);
        var chain = $q.when();
        angular.forEach(allUsersData, function (userObj, index) {
            chain = chain.then(function () {
                return userServices.getTransalatedLanguage(userObj.location).then(function (userResults) {
                    var translatedTxt = userResults.translations[0].translatedText;
                    var translation = translatedTxt.split("*");
                    userObj['translated'] = true;
                    userObj.translatedLocation = {};
                    userObj.translatedLocation.street = translation[0].trim();
                    userObj.translatedLocation.city = translation[1].trim();
                    userObj.translatedLocation.state = translation[2].trim();
                    userObj.errFlag = {
                        country: false,
                        state: false,
                        city: false,
                        street: false
                    }
                    if (allUsersData.length == (index + 1)) {
                        defer.resolve("COMPLETE - Got Complete User Details ");
                    }
                }).catch(function (errResponse) {
                    $scope.pageError = true;
                    $scope.pageErrorResponse = errResponse;
                    defer.reject(errResponse);
                });
            });

        });

        return deferPromise;
    };

    $scope.validateData = function (param) {
        var defer = $q.defer();
        var deferPromise = defer.promise;
        // General assumption is that the country is always true
        var chain = $q.when();
        angular.forEach(allUsersData, function (userObj, index) {
            chain = chain.then(function () {
                return userServices.checkData(userObj, param).then(function (locationResults) {
                    var val;
                    locationResults['user'] = userObj.firstName + " " + userObj.lastName;
                    if (locationResults.data.geonames.length > 0) {
                        var countryVal = locationResults.data.geonames.filter((city) => {
                            return ((city.countryName === userObj.location.country) && (city.fclName.includes(param)));
                        });
                        val = countryVal.length == 0 ? locationResults.data.geonames[0] : countryVal[0];
                        userObj[param] = val;
                        if (val.countryName == userObj.location.country)
                            userObj.errFlag[param] = false;
                        else {
                            userObj.errFlag[param] = true;
                        }
                    }
                    else {
                        userObj.errFlag[param] = false;
                        userObj[param] = { name: userObj.translatedLocation[param] };
                    }

                    if (allUsersData.length == (index + 1)) {
                        defer.resolve("COMPLETE - Got Complete User Details ");
                    }

                }).catch(function (errResponse) {
                    $scope.pageError = true;
                    $scope.pageErrorResponse = errResponse;
                    defer.reject(errResponse);
                });
            });
        });
        return deferPromise;
    };

    $scope.getCorrectData = function () {
        var defer = $q.defer();
        var deferPromise = defer.promise;
        var chain = $q.when(); var param;
        angular.forEach(allUsersData, function (userObj, index) {
            chain = chain.then(function () {
                if (userObj.errFlag.city)
                    param = 'state';
                if (userObj.errFlag.state)
                    param = 'city';
                var params = param == 'city' ? 'state' : 'city';
                userObj[params].correction = [];
                if (userObj.errFlag.city || userObj.errFlag.state) {
                    return userServices.checkData(userObj, param).then(function (locationResults) {
                        var val;
                        if (locationResults.data.geonames.length > 0) {
                            var countryVal = locationResults.data.geonames.filter((city) => {
                                return ((city.countryName === userObj.location.country) && (city.fclName.includes(params)));
                            });
                            if (countryVal.length > 0) {

                                userObj[params].correction = countryVal;
                            }
                            $scope.allUsers.push(userObj);
                        }
                        else {
                            $scope.allUsers.push(userObj);
                        }

                    }).catch(function (errResponse) {
                        $scope.pageError = true;
                        $scope.pageErrorResponse = errResponse;
                        defer.reject(errResponse);
                    });
                }
                else {
                    $scope.allUsers.push(userObj);
                }
                if (allUsersData.length == (index + 1)) {
                    defer.resolve("COMPLETE - Got Complete User Details ");
                }
            });
        });
        return deferPromise;
    };


    $scope.updateUser = function (index, param, val) {

        $scope.allUsers[index].location[param] = val;
        $scope.allUsers[index].translatedLocation[param] = val;
        $scope.allUsers[index].errFlag[param] = false;
    }

    $scope.loadMore = function () {
        $scope.loadMoreFlag = true;
        var chain = $q;
        chain = chain.when($scope.getAllUsers());
        chain = chain.then(function () { return $scope.getAllUserDetails(); });
        chain = chain.then(function () { return $scope.translate(); });
        chain = chain.then(function () { return $scope.validateData('city'); });
        chain = chain.then(function () { return $scope.validateData('state'); });
        chain = chain.then(function () { return $scope.getCorrectData(); });
        chain = chain.then(function () { return $scope.endLoading(); });
    };

    $scope.download = function () {

        var formatedData = [];
        const headersExcel = {
            id: "Id",
            title: "Title",
            firstName: "First Name",
            lastName: "Last Name",
            dateOfBirth: "Date of Birth",
            gender: "Gender",
            email: "Email",
            city: "City".replace(/,/g, ''),
            country: "Country".replace(/,/g, ''),
            state: "State".replace(/,/g, ''),
            street: "Address".replace(/,/g, ''),
            timezone: "Time Zone",
            phone: "Contact",
            picture: "Image URL",
            registerDate: "Created On",
            updatedDate: "Updated On"
        };

        angular.forEach($scope.allUsers, function (item, index) {
            formatedData.push({
                id: item.id,
                title: item.title.toUpperCase(),
                firstName: item.firstName,
                lastName: item.lastName,
                dateOfBirth: new Date(item.dateOfBirth).toDateString(),
                gender: item.gender,
                email: item.email,
                city: item.translatedLocation.city.replace(/,/g, ''),
                country: item.location.country.replace(/,/g, ''),
                state: item.translatedLocation.state.replace(/,/g, ''),
                street: item.translatedLocation.street.replace(/,/g, ''),
                timezone: item.location.timezone,
                phone: item.phone,
                picture: item.picture,
                registerDate: new Date(item.registerDate).toDateString(),
                updatedDate: new Date(item.updatedDate).toDateString()
            });
        });

        var fileTitle = 'UserData_' + new Date().toDateString(); // or 'my-unique-title'

        exportCSVFile(headersExcel, formatedData, fileTitle);

    }

    function init() {
        var chain = $q;
        chain = chain.when($scope.startLoading("Started Initialization"));
        chain = chain.then(function () { return $scope.getLoggedUserProfile(); });

        switch (pageMap.get($scope.pageDetails.pageName).loadConfig) {
            case "BASIC":
                break;
            case "ALLUSERS":
                chain = chain.then(function () { return $scope.getAllUsers(); });
                chain = chain.then(function () { return $scope.getAllUserDetails(); });
                chain = chain.then(function () { return $scope.translate(); });
                chain = chain.then(function () { return $scope.validateData('city'); });
                chain = chain.then(function () { return $scope.validateData('state'); });
                chain = chain.then(function () { return $scope.getCorrectData(); });
                break;
        }
        chain = chain.then(function () { return $scope.logAction('PAGELOAD', ''); });
        chain = chain.then(function () { return $scope.endLoading(); });

    }

    function cleanUpLoading() {
        if ($scope.pageErrorResponse.length > 0) {
            $scope.pageError = true;
            $scope.loading = true;
        } else {
            $scope.loading = false;
            $scope.loadMoreFlag = false;
            $scope.pageError = false;
            $scope.pageErrorResponse = [];
        }

    }

    function convertToCSV(objArray) {
        var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
        var str = '';

        for (var i = 0; i < array.length; i++) {
            var line = '';
            for (var index in array[i]) {
                if (line != '') line += ','

                line += array[i][index];
            }

            str += line + '\r\n';
        }

        return str;
    }

    function exportCSVFile(headers, items, fileTitle) {
        if (headers) {
            items.unshift(headers);
        }

        // Convert Object to JSON
        var jsonObject = JSON.stringify(items);

        var csv = convertToCSV(jsonObject);

        var exportedFilenmae = fileTitle + '.csv' || 'export.csv';

        var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        if (navigator.msSaveBlob) { // IE 10+
            navigator.msSaveBlob(blob, exportedFilenmae);
        } else {
            var link = document.createElement("a");
            if (link.download !== undefined) {
                var url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", exportedFilenmae);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        }
    }


    init();

});