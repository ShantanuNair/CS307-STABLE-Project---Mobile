///<reference path="https://ajax.googleapis.com/ajax/libs/angularjs/1.4.9/angular.min.js" />
/*global angular*/
var app = angular.module('app', ['firebase']);
var userName = null;                                     //For debugging if userName reset on controller change [It is...]
var debugMode = true;                                    //For debugging permission issues and read/writes using Firebase.enableLogging(true); Extremely useful

app.factory("Auth", ["$firebaseAuth",
  function($firebaseAuth) {
    var ref = new Firebase("https://blistering-heat-6128.firebaseio.com");
      
    return $firebaseAuth(ref);
  }
]);

////For programmatic capturing of messages instead of just sending to console. Implement callback as needed.
//Firebase.enableLogging(function(logMessage) {
//  // Add a timestamp to the messages.
//  console.log(new Date().toISOString() + ': ' + logMessage);
//});
//Remember to comment out Firebase.enableLogging() when done debugging. It's only used by firebase's internal team, and isn't documented OR supported. May behave unexpectedly!


app.controller("authenticationCtrl", ["$scope", "Auth", "$firebaseObject",'$window', function($scope, Auth, $firebaseObject, $window) {
    $scope.auth = Auth;
    //Firebase.enableLogging(debugMode);
    // any time auth status updates, add the user data to scope
    $scope.auth.$onAuth(function(authData) {
      $scope.authData = authData;
      if(authData){
   
          userName = authData.uid;    
          //Check if there's any firebaseURL/Users/$User child === uid. If there isn't add one with default json.
      }
      else{

          userName = null;
      }
      if(userName){
          var FB = new Firebase("https://blistering-heat-6128.firebaseio.com");
          FB.child("/Users/" + userName).once('value', function(newUserPath) {
              if( newUserPath.val() === null ) { /* does not exist */    //Todo: Add non-existing user with defautls.

                  var userRef = new Firebase("https://blistering-heat-6128.firebaseio.com/Users/");
//                  var userObj = $firebaseObject(userURL);
                  userRef.child(authData.uid).set({                                                                    //Holy fucking defaults. TODO: Split this up to not make it so huge.            
                                  "invisibleNode":0,
                                  "ExportNum":{"num":0},
                                  "ExportQueue":{"0":"default"}
                  });

                  $window.location.href = '/MainPage.html';
              } 
              else { 
                  /* exists, then do nothing */

                  $window.location.href = '/MainPage.html';
              }    
          });
      }
      

    });

      
}]);

app.controller('horseDataController', [ '$scope', '$firebaseArray','$firebaseObject', "Auth", '$http', '$window', function ($scope, $firebaseArray, $firebaseObject, Auth, $http, $window) {
    //Firebase.enableLogging(true);
    var authRef = new Firebase("https://blistering-heat-6128.firebaseio.com");
    authDataObj = authRef.getAuth();                                                                                 //Literally death.
    userName = authDataObj.uid;
    var resetVaccines = 'https://blistering-heat-6128.firebaseio.com/Users/' + userName+ '/vacsToBeAdded';
    var resetTraining = 'https://blistering-heat-6128.firebaseio.com/Users/' + userName+ '/trainingToBeAdded';
    var rV = new Firebase(resetVaccines);
    var rT = new Firebase(resetTraining);
    rV.set("");
    rT.set("");
    var url = 'https://blistering-heat-6128.firebaseio.com/Users/' + userName+ '/horses';
    var horses = new Firebase(url);
    $scope.horses = $firebaseArray(horses);
    $window.onclick = function(event) {
        var modal = document.getElementById("vaccineModal");
        var trainingModal = document.getElementById("trainingModal");
        var interior = document.getElementById("vaccineModalInterior");
        var allItems = document.getElementById("all");
        if (event.target == allItems) {
            modal.style.display = "none";
            trainingModal.style.display = "none";
        }
    }
    $scope.loadFile = function () {
        var output = document.getElementById('output');
            
        var d = document.querySelector('input[type=file]').files[0];
        var reader = new FileReader();
        var dataurl;
        reader.readAsDataURL(d);
        reader.addEventListener("load", function() {
            dataurl = reader.result;
            output.src = dataurl;
            //console.log(output.src);
        }, false);
    };
    var vaccinesInHorseForm = new Firebase('https://blistering-heat-6128.firebaseio.com/Users/'+userName+'/vaccines');              //Needed to populate vaccubes in horseForm
    $scope.vaccines = $firebaseArray(vaccinesInHorseForm);
    var regimensInHorseForm = new Firebase('https://blistering-heat-6128.firebaseio.com/Users/'+userName+'/regimens');
    $scope.regimens = $firebaseArray(regimensInHorseForm);
    $scope.vacList = [];
    $scope.vaccineList = "";
    $scope.trainingList = [];
    $scope.trainingString = "";
    $scope.addVaccineToHorse = function(vaccineName){
        if ($scope.vacList.indexOf(vaccineName) == -1)
            $scope.vacList.push(vaccineName);
        var list = document.getElementById("list");
        list.innerHTML = "<table class=\"table\"><thead></thead><tbody>";
        for (var i = 0; i < $scope.vacList.length; i++) {
            list.innerHTML += "<tr><td>" + $scope.vacList[i] + "</td></tr><hr>";
        }
        list.innerHTML += "</tbody></table>";

        $scope.vaccineList = "";
         for (var i = 0; i < $scope.vacList.length; i++) {

            if ( i == $scope.vacList.length - 1) {
                $scope.vaccineList += $scope.vacList[i];
            }
            else {
                $scope.vaccineList += $scope.vacList[i] + "|";
            }
        }

        var urlAdd = 'https://blistering-heat-6128.firebaseio.com/Users/'+userName+'/vacsToBeAdded';
        var authenticatedUsersAdd = new Firebase(urlAdd);
        authenticatedUsersAdd.set($scope.vaccineList);
        //TODO: Add vacList to createHorse under "vaccines": json key. Format if necessary.
    }

    $scope.addTrainingToHorse = function(trainingName) {
        if ($scope.trainingList.indexOf(trainingName) == -1)
            $scope.trainingList.push(trainingName);
        var list = document.getElementById("trainingList");
        list.innerHTML = "<table class=\"table\"><thead></thead><tbody>";
        for (var i = 0; i < $scope.trainingList.length; i++) {
            list.innerHTML += "<tr><td>" + $scope.trainingList[i] + "</td></tr><hr>";
        }
        list.innerHTML += "</tbody></table>";

        $scope.trainingString = "";
         for (var i = 0; i < $scope.trainingList.length; i++) {
            if ( i == $scope.trainingList.length - 1) {
                $scope.trainingString += $scope.trainingList[i];
            }
            else {
                $scope.trainingString += $scope.trainingList[i] + "|";
            }
        }

        var urlAdd = 'https://blistering-heat-6128.firebaseio.com/Users/'+userName+'/trainingToBeAdded';
        var authenticatedUsersAdd = new Firebase(urlAdd);
        authenticatedUsersAdd.set($scope.trainingString);
    }
    $scope.removeTrainingFromHorse = function(trainingName){
        for(var i=$scope.trainingList.length-1; i>=0; i--) {
            if ($scope.trainingList[i] === trainingName) {
                $scope.trainingList.splice(i, 1);
                // break;       //<-- Uncomment  if only the first term has to be removed
            }
        }
        var list = document.getElementById("trainingList");
        list.innerHTML = "<table class=\"table\"><thead></thead><tbody>";
        for (var i = 0; i < $scope.trainingList.length; i++) {
            list.innerHTML += "<tr><td>" + $scope.trainingList[i] + "</td></tr><hr>";
        }
        list.innerHTML += "</tbody></table>";

        $scope.trainingString = "";
         for (var i = 0; i < $scope.trainingList.length; i++) {
            if ( i == $scope.trainingList.length - 1) {
                $scope.trainingString += $scope.trainingList[i];
            }
            else {
                $scope.trainingString += $scope.trainingList[i] + "|";
            }
        }

        var urlAdd = 'https://blistering-heat-6128.firebaseio.com/Users/'+userName+'/trainingToBeAdded';
        var authenticatedUsersAdd = new Firebase(urlAdd);
        authenticatedUsersAdd.set($scope.trainingString);
    }  
    $scope.openModal = function() {
        var modal = document.getElementById("vaccineModal");
        modal.style.display = "block";
    }
    $scope.openTrainingModal = function() {
        var modal = document.getElementById("trainingModal");
        modal.style.display = "block";
    }
    $scope.closeModal = function() {
        var modal = document.getElementById("vaccineModal");
        modal.style.display = "none";
    }
    $scope.closeTrainingModal = function() {
        var modal = document.getElementById("trainingModal");
        modal.style.display= "none";
    }
    $scope.removeVaccineFromHorse = function(vaccineNameToRemove){
        for(var i=$scope.vacList.length-1; i>=0; i--) {
            if ($scope.vacList[i] === vaccineNameToRemove) {
                $scope.vacList.splice(i, 1);
                // break;       //<-- Uncomment  if only the first term has to be removed
            }
        }
        var list = document.getElementById("list");
        list.innerHTML = "<table class=\"table\"><thead></thead><tbody>";
        for (var i = 0; i < $scope.vacList.length; i++) {
            list.innerHTML += "<tr><td>" + $scope.vacList[i] + "</td></tr><hr>";
        }
        list.innerHTML += "</tbody></table>";

        $scope.vaccineList = "";
         for (var i = 0; i < $scope.vacList.length; i++) {
            if ( i == $scope.vacList.length - 1) {
                $scope.vaccineList += $scope.vacList[i];
            }
            else {
                $scope.vaccineList += $scope.vacList[i] + "|";
            }
        }

        var urlAdd = 'https://blistering-heat-6128.firebaseio.com/Users/'+userName+'/vacsToBeAdded';
        var authenticatedUsersAdd = new Firebase(urlAdd);
        authenticatedUsersAdd.set($scope.vaccineList);
        //TODO: Add vacList to createHorse under "vaccines": json key. Format if necessary.
    }   

    $scope.createHorse = function () {

        var urlGET = new Firebase("https://blistering-heat-6128.firebaseio.com/Users/"+userName);              //Needed to populate vaccubes in horseForm
        

        var ref = new Firebase("https://blistering-heat-6128.firebaseio.com/Users/"+userName);
        $scope.cObj = $firebaseObject(ref);
        $scope.cObj.$loaded().then(function() {
            $scope.vaccineList = $scope.cObj.vacsToBeAdded;
            $scope.trainingString = $scope.cObj.trainingToBeAdded;
            var output = document.getElementById('output');
            var horse = {
                "name": $scope.horseName,
                "gender": $scope.horseGender,
                "breed": $scope.horseBreed,
                "weight": $scope.horseWeight,
                "dob": $scope.horseDOB,
                "sire": $scope.horseSire,
                "mare": $scope.horseMare,
                "price": $scope.horsePrice,
                "training": $scope.trainingString,
                "vaccines": $scope.vaccineList,
    //            "training": $scope.horseTraining,
                "image": output.src,
                "notes": $scope.notes
            };
            if (typeof horse.name != "string" || typeof horse.name === null) {
                alert("Please check the name of the horse");
            }
            else if (typeof horse.gender != "string" || typeof horse.gender === null) {
                alert("Please check the gender of the horse");
            }
            else if (typeof horse.breed != "string" || typeof horse.breed === null) {
                alert("Please check the breed of the horse");
            }
            else if (typeof horse.weight != "number" || typeof horse.weight === null || horse.weight < 0) {
                alert("Please check the weight of the horse");
            }
            else if (typeof horse.sire != "string" || typeof horse.sire === null) {
                alert("Please check the sire of the horse");
            }
            else if (typeof horse.mare != "string" || typeof horse.mare === null) {
                alert("Please check the mare of the horse");
            }
            else if (typeof horse.price != "number" || typeof horse.price === null || horse.price < 0) {
                alert("Please check the price of the horse");
            }
            else {
                if (typeof horse.dob === "undefined") {
                    horse.dob = "";

                }
                if (typeof horse.vaccines === "undefined") {
                    horse.vaccines = "";
                }
                if (typeof horse.training === "undefined") {
                    horse.training = "";
                }
                if (typeof horse.image === "undefined") {
                    horse.image = "";
                }
                if (horse.image.indexOf(".html") > -1) {
                    horse.image = "";
                }
                var urlAdd = 'https://blistering-heat-6128.firebaseio.com/Users/'+userName+'/horses/' + horse.name;
                var authenticatedUsersAdd = new Firebase(urlAdd);
                authenticatedUsersAdd.set({
                    name:horse.name,
                    gender:horse.gender,
                    breed:horse.breed,
                    weight:horse.weight,
                    dob:horse.dob,
                    sire:horse.sire,
                    mare:horse.mare,
                    auctionPrice:horse.price,
                    notes:horse.notes,
                    training:horse.training,
                    vaccines:horse.vaccines,
                    image:horse.image
                });
                //$scope.resetFields();
                $window.location.href = '/horseDatabase.html';
            }
        });
    };
}]);

app.controller('vaccineFormController', [ '$scope', '$firebaseArray',"Auth", '$http', '$window', function ($scope, $firebaseArray, Auth, $http, $window) {
    var authRef = new Firebase("https://blistering-heat-6128.firebaseio.com");
    authDataObj = authRef.getAuth();                                                                                 //Literally death.
    userName = authDataObj.uid;

    var url = 'https://blistering-heat-6128.firebaseio.com/Users/'+userName+'/vaccines';
    var vaccines= new Firebase(url);
    $scope.vaccines = $firebaseArray(vaccines);
    //Firebase.enableLogging(debugMode);

    $scope.createVaccine = function () {
        var vaccine = {
            "name": $scope.vaccineName,
            "description": $scope.vaccineDescription,
            "instruction": $scope.vaccineInstructions,
            "seller": $scope.vaccineSeller,
            "price": $scope.vaccinePrice,
        };

        if (typeof vaccine.name != "string" || typeof vaccine.name === null) {
            alert("Please provide a valid vaccine name");
        }
        else if (typeof vaccine.seller != "string" || typeof vaccine.seller === null) {
            alert("Please provide valid seller info");
        }
        else if (typeof vaccine.price != "number" || typeof vaccine.price === null || vaccine.price < 0) {
            alert("Please provide a valid price");
        }
        else{
            if (typeof vaccine.description === "undefined") {
                vaccine.description = "";
            }
            if (typeof vaccine.instruction === "undefined") {
                vaccine.instruction = "";
            }
            var urlAdd = 'https://blistering-heat-6128.firebaseio.com/Users/' + userName+'/vaccines/' + vaccine.name;
            var vaccinesAdd = new Firebase(urlAdd);
            vaccinesAdd.set(vaccine);
            $window.location.href = '/vaccineDatabase.html';
        }

    };
}]);


app.controller('trainingFormController', [ '$scope', '$firebaseArray', '$http', '$window', 'Auth', function ($scope, $firebaseArray, $http, $window, Auth) {
    //Firebase.enableLogging(debugMode);
    
    var authRef = new Firebase("https://blistering-heat-6128.firebaseio.com");
    authDataObj = authRef.getAuth();                                                                                 //Literally death.
    userName = authDataObj.uid;

    
    var url = 'https://blistering-heat-6128.firebaseio.com/Users/' + userName + '/regimens';
    var regimens = new Firebase(url);
    $scope.regimens = $firebaseArray(regimens);

    $scope.createRegimen = function () {
        var regimen = {
            "name": $scope.trainingName,
            "exercise": $scope.trainingExercise,
            "food": $scope.trainingFood,
            "location": $scope.trainingLocation,
            "equipment": $scope.trainingEquipment,
        };

        if (typeof regimen.name != "string" || typeof regimen.name=== null) {
            alert("Please provide a valid regimen name");
        }
        else if (typeof regimen.exercise != "string" || typeof regimen.exercise  === null) {
            alert("Please provide a valid exercise");
        }
        else {
            if (typeof regimen.food === "undefined") {
                regimen.food = "";
            }
            if (typeof regimen.location === "undefined") {
                regimen.location = "";
            }
            if (typeof regimen.equipment=== "undefined") {
                regimen.equipment = "";
            }

            var urlAdd = 'https://blistering-heat-6128.firebaseio.com/Users/' + userName+ '/regimens/' + regimen.name;
            var regimensAdd = new Firebase(urlAdd);
            regimensAdd.set(regimen);
            $window.location.href = '/trainingDatabase.html';
        }


    };
}]);


app.controller('MainPageController', [ '$scope', '$firebaseArray', '$http', '$window', '$firebaseObject', 'Auth', function ($scope, $firebaseArray, $http, $window, $firebaseObject, Auth) {
        $scope.auth = Auth;
        var authRef = new Firebase("https://blistering-heat-6128.firebaseio.com");
        authDataObj = authRef.getAuth();                                                                                 //Literally    death.
        userName = authDataObj.uid;
    
        /*
        $window.onclick = function(event) {
            var exportModal = document.getElementById("exportModal");
            console.log(event.target);
            if (event.target != exportModal) {
                exportModal.style.display = "none";
            }
        };
        */
        $scope.openExportModal = function() {
            var modal = document.getElementById("exportModal");
            modal.style.display= "block";
        };
        $scope.closeExportModal = function() {
            var modal = document.getElementById("exportModal");
            modal.style.display= "none";
        };
    
        var Eref = new Firebase("https://blistering-heat-6128.firebaseio.com/Users/"+userName+"/ExportQueue");
        $scope.returnedObj = $firebaseObject(Eref);
        $scope.returnedObj.$loaded().then(function() {
            $scope.ehorses = [];
            $scope.evaccines = [];
            $scope.eregimens = [];
            if (typeof $scope.returnedObj[0] === "string") {
                document.getElementById("exportModalInterior").innerHTML = "<i><span style='color: #ffffff; font-family: calibri,serif;'><h2>Export Queue</h2></span></i><span style='color: #ffffff; font-family: calibri,serif;'>Export Queue is Empty</span><br><br><button  id='closeExportModal' class='btn btn-primary btn-lg' style='left:50%' onclick=\"getElementById('exportModal').style.display='none'\">Close</button>";
                return;
            }
            else {
            for (var i = 0; typeof $scope.returnedObj[i] != "undefined"; i++) {
                if (typeof $scope.returnedObj[i].gender != "undefined") {
                    $scope.ehorses.push($scope.returnedObj[i]);
                }
                else if (typeof $scope.returnedObj[i].seller != "undefined") {
                    $scope.evaccines.push($scope.returnedObj[i]);
                }
                else {
                    $scope.eregimens.push($scope.returnedObj[i]);
                }
            }
            //console.log($scope.ehorses);
            //console.log($scope.evaccines);
            //console.log($scope.eregimens);
            }
        });
        


        //Firebase.enableLogging(debugMode);	
        var urlH = 'https://blistering-heat-6128.firebaseio.com/Users/' + userName + '/horses';
    	var horses = new Firebase(urlH);
    	$scope.horses = $firebaseArray(horses);
    
        var urlV = 'https://blistering-heat-6128.firebaseio.com/Users/' + userName + '/vaccines';  
        var vaccines = new Firebase(urlV);
	    $scope.vaccines = $firebaseArray(vaccines);
    
    	var urlR = 'https://blistering-heat-6128.firebaseio.com/Users/' + userName + '/regimens';
    	var regimens = new Firebase(urlR);
    	$scope.regimens = $firebaseArray(regimens);
    //                $scope.username = "Username";
    	$scope.toHorse = function(name) {

            var reqUrl = 'https://blistering-heat-6128.firebaseio.com/Users/' + userName + '/Requests/one';
            var request = new Firebase(reqUrl);

            request.set(name);
            $window.location.href = '/horseProfile.html';
        }
        var d = new Date();
        $scope.date = d;
    
        $scope.searchOn = false;
        $scope.toggleSearch = function() {
            $scope.searchOn = !($scope.searchOn);
        };
        
        $scope.toWindow = function(name) {
            $window.location.href = name;
        };
        
        var OnCompleteHorse = function(error) {
            if (error) {
                //console.log("Search Not Found");
                alert("The name you entered could not be found. Please try another name.");
            }
            else {
                //console.log("Search Found");
//                $window.location.href = '/horseProfile.html';
            }
        }
        
        var OnCompleteVaccine = function(error) {
            if (error) {
                //console.log("Search Not Found");
            } else {
                //console.log("Search Found");
//                $window.location.href = '/vaccineProfile.html';
            }
        }
        
        var OnCompleteRegimen = function(error) {
            if (error) {
                //console.log("Search Not Found");
            } else {
                console.log("Search Found");
//                $window.location.href = '/trainingProfile.html';
            }
        }
    
        $scope.toWindowForSearch = function(name) {
            //console.log(name);
            if (typeof name != 'undefined') {
        	 var category;
            	for (var i = 0; i < document.getElementsByName("searchCategory").length; i++) {
        	       if (document.getElementsByName("searchCategory")[i].checked) {
        	           category = document.getElementsByName("searchCategory")[i].value;
        	           break;
        	       }
                }
                var found = false;
                if (category === "s_horse") {

                    var count = 0;
                    while(typeof $scope.horses[count] != 'undefined') {
                        /*
                        if ($scope.horses[count].name.localeCompare(name)) {
                            found = true;
                        }
                        */
                        if ($scope.horses[count].name == name) {
                            found = true;
                        }
                        count++;
                    }
                    if (!found || typeof name == 'undefined') {

                        alert("The name you entered could not be found. Please try another name.");
                        return;
                    }
                    var reqUrl1 = 'https://blistering-heat-6128.firebaseio.com/Users/' + userName + '/HorseRequests/one';        //TESTING auth support
                    var request1 = new Firebase(reqUrl1);
                    request1.set(name, OnCompleteHorse);
                    var reqUrl = 'https://blistering-heat-6128.firebaseio.com/Users/' + userName + '/Requests/one';
                    var request = new Firebase(reqUrl);

                    request.set(name, OnCompleteHorse);
        	        $window.location.href = '/horseProfile.html';
                }
                else if (category === "s_vaccine") {
                    var count = 0;
                    while (typeof $scope.vaccines[count] != 'undefined') {

                        if ($scope.vaccines[count].name == name) {
                            found = true;
                        }    
                        count++;
                    }
                    if (!found || typeof name == 'undefined') {
                        alert("The name you entered could not be found. Please try another name.");

                        return;
                    }
                    var reqUrl = 'https://blistering-heat-6128.firebaseio.com/Users/' + userName + '/VaccineRequests/one';
                    var request = new Firebase(reqUrl);

                    request.set(name, OnCompleteVaccine);
                    var reqUrl1 = 'https://blistering-heat-6128.firebaseio.com/Users/' +userName+ '/VaccineEditRequests/one';
                    var request1 = new Firebase(reqUrl1);
                    request1.set(name);
        	        $window.location.href = '/vaccineProfile.html';
                }
                else if (category === "s_training") {
                    var count = 0;
                    while (typeof $scope.regimens[count] != 'undefined') {

                        if ($scope.regimens[count].name == name) {
                            found = true;
                        }
                        count++;
                    }
                    if (!found || typeof name == 'undefined') {
                        alert("The name you entered could not be found. Please try another name.");

                        return;
                    }
                    var reqUrl = 'https://blistering-heat-6128.firebaseio.com/Users/' + userName + '/TrainingProfileRequests/one';
                    var request = new Firebase(reqUrl);

                    request.set(name, OnCompleteRegimen);
                    var reqUrl1 = 'https://blistering-heat-6128.firebaseio.com/Users/' +userName+ '/TrainingRequests/one';
                    var request1 = new Firebase(reqUrl1);
                    request1.set(name);
        	        $window.location.href = '/trainingProfile.html';
                }
	       }
        };
     var d = new Date();
     var days = ["January", "February", "March", "April", "May", "June", "July", "August","September", "October", "November", "December"];
     var month = days[d.getMonth()];
     $scope.date = month + " " + d.getDate() + ", " + d.getFullYear();
     $scope.newHorse = function() {
         $window.location.href = '/horseForm.html';
     };
     $scope.newVaccine = function() {
         $window.location.href = '/vaccineForm.html';
     };
     $scope.newTraining = function() {
         $window.location.href = '/trainingForm.html';
     };
     $scope.horseDatabase = function() {
         $window.location.href = '/horseDatabase.html';
     };
     $scope.vaccineDatabase = function() {
         $window.location.href = '/vaccineDatabase.html';
     };
     $scope.trainingDatabase = function() {
         $window.location.href = '/trainingDatabase.html';
     };
     $scope.calendarPage = function() {
         $window.location.href = '/calendarPage.html';
     };
     $scope.logout = function() {
         $scope.auth.$unauth();
         $window.location.href = '/login.html';
     };
      $scope.search = function(){
        var category;
        for (var i = 0; i < document.getElementsByName("searchCategory").length; i++) {
            if (document.getElementsByName("searchCategory")[i].checked) {
                category = document.getElementsByName("searchCategory")[i].value;
                break;
            }
        }
        if (category === "s_horse") {
            $scope.searchCategory = $scope.horses;
        }
        else if (category === "s_vaccine") {
            $scope.searchCategory = $scope.vaccines;
        }
        else if (category === "s_training") {
            $scope.searchCategory = $scope.regimens;
        }
	};

    $scope.AssignValueAndHide = function(n){
		 $scope.searchText = n;
		 $scope.searchCategory=[];
	};
}]);

app.controller('HorseController', ['$scope', '$firebaseArray', '$window', '$http','$firebaseObject', 'Auth', function($scope, $firebaseArray, $window, $http,$firebaseObject, Auth) {
    $window.onclick = function(event) {
        var modal = document.getElementById("vaccineModal");
        var notesModal = document.getElementById("notesModal");
        var trainingModal = document.getElementById("trainingModal");
        var interior = document.getElementById("vaccineModalInterior");
        var allItems = document.getElementById("all");
        //console.log(event.target);
        if (event.target == allItems) {
            modal.style.display = "none";
            trainingModal.style.display = "none";
            notesModal.style.display = "none";
        }
    }
    
    var authRef = new Firebase("https://blistering-heat-6128.firebaseio.com");
    authDataObj = authRef.getAuth();                                                                                 //Literally death.
    userName = authDataObj.uid;

    var reqUrl = 'https://blistering-heat-6128.firebaseio.com/Users/' +userName+ '/HorseRequests';
    var ref = new Firebase(reqUrl);
    $scope.returnedObj = $firebaseObject(ref);
    $scope.returnedObj.$loaded().then(function () {
        //console.log("loaded");
        $scope.searchName = $scope.returnedObj.one;
        var url = "https://blistering-heat-6128.firebaseio.com/Users/" + userName + "/horses/" + $scope.searchName;
        var ref2 = new Firebase(url);
        $scope.secondObj = $firebaseObject(ref2);
        $scope.secondObj.$loaded().then(function () {
            $scope.params = $scope.secondObj;
            if (typeof $scope.params.image == "undefined") {
                $scope.params.image = "http://www.aspneter.com/aspneter/wp-content/uploads/2016/01/no-thumb.jpg";
            }
            if ($scope.params.image.localeCompare("") == 0) {
                $scope.params.image = "http://www.aspneter.com/aspneter/wp-content/uploads/2016/01/no-thumb.jpg";
            }
             var imageTag = document.getElementById("img");
            imageTag.src = $scope.params.image;
            var reqUrl = 'https://blistering-heat-6128.firebaseio.com/Users/' +userName+ '/Requests/one';
            var request = new Firebase(reqUrl);
            request.set($scope.searchName);
            var element = document.getElementById("information");
            $scope.vacList = $scope.params.vaccines.split("|");
            var url3 = "https://blistering-heat-6128.firebaseio.com/Users/" + userName + "/vaccines";
            var ref3 = new Firebase(url3);
            $scope.thirdObj = $firebaseObject(ref3);
            $scope.thirdObj.$loaded().then(function() {
                $scope.vaccines = [];
                
                for (var i = 0; i < $scope.vacList.length; i++) {
                    $scope.vaccines.push($scope.thirdObj[$scope.vacList[i]]);
                    //console.log($scope.thirdObj[$scope.vacList[i]]);    
                }
                if (typeof $scope.vaccines[0] == "undefined") {
                    $scope.vaccines = [];
                }
                for (var i = 0; i < $scope.vaccines.length; i++) {
                    if (typeof $scope.vaccines[i] == "undefined") {
                        $scope.vaccines.splice(i,1);
                    }
                }
            });
            $scope.trainingList = $scope.params.training.split("|");
            var url4 = "https://blistering-heat-6128.firebaseio.com/Users/" + userName + "/regimens";
            var ref4 = new Firebase(url4);
            $scope.fourthObj = $firebaseObject(ref4);
            $scope.fourthObj.$loaded().then(function () {
                $scope.regimens = [];
                for (var i = 0; i < $scope.trainingList.length; i++) {
                    $scope.regimens.push($scope.fourthObj[$scope.trainingList[i]]);
                }
                if (typeof $scope.regimens[0] == "undefined") {
                    $scope.regimens = [];
                }
                for (var i = 0; i < $scope.regimens.length; i++) {
                    if (typeof $scope.regimens[i] == "undefined") {
                        $scope.regimens.splice(i,1);
                    }
                }
            });
        });
        
        
    });
    $scope.goToRegime = function(name) {
        var reqUrl = 'https://blistering-heat-6128.firebaseio.com/Users/' + userName + '/TrainingProfileRequests/one';
        var request = new Firebase(reqUrl);
        request.set(name);

        $window.location.href = '/trainingProfile.html';
    }
    $scope.goToVaccine = function(name) {
        var reqUrl = 'https://blistering-heat-6128.firebaseio.com/Users/' + userName + '/VaccineRequests/one';
        var request = new Firebase(reqUrl);
        request.set(name);
        $window.location.href = '/vaccineProfile.html';
    }
    $scope.openModal = function() {
        var modal = document.getElementById("vaccineModal");
        modal.style.display = "block";
    }
    $scope.openNotesModal = function() {
        var modal = document.getElementById("notesModal");
        modal.style.display = "block";
    }
    $scope.openTrainingModal = function() {
        var modal = document.getElementById("trainingModal");
        modal.style.display = "block";
    }
    $scope.closeModal = function() {
        var modal = document.getElementById("vaccineModal");
        modal.style.display = "none";
    }
    $scope.closeNotesModal = function() {
        var modal = document.getElementById("notesModal");
        modal.style.display = "none";
    }
    $scope.closeTrainingModal = function() {
        var modal = document.getElementById("trainingModal");
        modal.style.display= "none";
    }
    $scope.removeHorse = function() {
        //alert("Horse Removed!");
        if (!confirm("Are you sure you want to remove this horse permanently?")) {
            return;   
        }
        var urlAdd = 'https://blistering-heat-6128.firebaseio.com/Users/'+userName+'/horses/';
        var authenticatedUsersAdd = new Firebase(urlAdd);
        authenticatedUsersAdd.child($scope.searchName).remove(function(response) {
            $window.location.href = '/horseDatabase.html';
        });
    }
    $scope.edit = function() {
        $window.location.href = '/editHorse.html';
    };
    $scope.toDatabase = function() {
        $window.location.href = '/horseDatabase.html';
    };
    $scope.mainPage = function() {
        $window.location.href = '/MainPage.html';
    }
    
}]);

app.controller('CalendarController', ['$scope', '$firebaseArray', '$window', '$http',function($scope, $firebaseArray, $window, $http) {
    //Firebase.enableLogging(debugMode);
    $scope.edit = function() {
        $window.location.href = '/editHorse.html';
    };
    $scope.addEvent = function() {
        alert("Event Added!");
    };
    $scope.mainPage = function() {
        $window.location.href = '/MainPage.html';
    }
    
}]);

app.controller('HorseCtrl', ['$scope', '$firebaseArray', '$window', '$http','$firebaseObject', 'Auth',function($scope, $firebaseArray, $window, $http,$firebaseObject, Auth) {
//Firebase.enableLogging(true);
    
    var authRef = new Firebase("https://blistering-heat-6128.firebaseio.com");
    authDataObj = authRef.getAuth();                                                                                 //Literally death.
    userName = authDataObj.uid;

    
    //var myHorses = new Firebase('https://blistering-heat-6128.firebaseio.com/horses');                                             //Enable to use single user mode.
    var myHorses = new Firebase('https://blistering-heat-6128.firebaseio.com/Users/' + userName + '/horses');         //TESTING auth suport
    
    $scope.horses = $firebaseArray(myHorses);
    $scope.back = function() {

        $window.location.href = '/MainPage.html';
    };
    $scope.showForm = function(){
        $window.location.href = '/horseForm.html';
    };

    $scope.hideForm = function() {
        $scope.addFormShow = false;
    };
    $scope.edit = function(name) {
        console.log(name);
        var reqUrl = 'https://blistering-heat-6128.firebaseio.com/Users/' + userName + '/Requests/one';
        var request = new Firebase(reqUrl);
        request.set(name);
        $window.location.href = '/editHorse.html';
    };
    $scope.goToHorseProfile = function(name) {
        console.log(name);
        var reqUrl1 = 'https://blistering-heat-6128.firebaseio.com/Users/' + userName + '/HorseRequests/one';        //TESTING auth support
        //console.log(reqUrl1);
        var request1 = new Firebase(reqUrl1);
        request1.set(name);

        $window.location.href = '/horseProfile.html';
    };
    function clearForm(){
        $scope.name='';
        $scope.gender='';
        $scope.breed='';
        $scope.weight='';
        $scope.dob='';
        $scope.sire='';
        $scope.mare='';
        $scope.auctionPrice='';
    };
    $scope.removeHorse = function(horse) {
        //var urlAdd = 'https://blistering-heat-6128.firebaseio.com/horses/';
        if (!confirm("Are you sure you want to remove this horse permanently?")) {
            return;   
        }
        var urlAdd = 'https://blistering-heat-6128.firebaseio.com/Users/' + userName +'/horses/';                          //TESTING auth support
        var authenticatedUsersAdd = new Firebase(urlAdd);
        authenticatedUsersAdd.child(horse.name).remove(function(response) {
            //$window.location.href = '/horseDatabase.html';
        });
    }
    $scope.addToQueue = function(name) {
        //var url = "https://blistering-heat-6128.firebaseio.com/horses/" + name + ".json";
        var url = "https://blistering-heat-6128.firebaseio.com/Users/" +userName+ "/horses/" + name;                            //TESTING auth support
        var ref = new Firebase(url);
        $scope.returnedObj = $firebaseObject(ref);
        $scope.returnedObj.$loaded().then(function () {
            if (typeof $scope.returnedObj.image === "undefined") {
                var horse = {
                    "name": $scope.returnedObj.name,
                    "gender": $scope.returnedObj.gender,
                    "breed": $scope.returnedObj.breed,
                    "weight": $scope.returnedObj.weight,
                    "dob": $scope.returnedObj.dob,
                    "sire": $scope.returnedObj.sire,
                    "mare": $scope.returnedObj.mare,
                    "auctionPrice": $scope.returnedObj.auctionPrice,
                    "notes": $scope.returnedObj.notes,
                    "vaccines": $scope.returnedObj.vaccines,
                    "training": $scope.returnedObj.training
                };
            }
            else {
                var horse = {
                    "name": $scope.returnedObj.name,
                    "gender": $scope.returnedObj.gender,
                    "breed": $scope.returnedObj.breed,
                    "weight": $scope.returnedObj.weight,
                    "dob": $scope.returnedObj.dob,
                    "sire": $scope.returnedObj.sire,
                    "mare": $scope.returnedObj.mare,
                    "auctionPrice": $scope.returnedObj.auctionPrice,
                    "notes": $scope.returnedObj.notes,
                    "vaccines": $scope.returnedObj.vaccines,
                    "image": $scope.returnedObj.image,
                    "training": $scope.returnedObj.training
                };
            }
            

            var numUrl = "https://blistering-heat-6128.firebaseio.com/Users/" +userName+ "/ExportNum";                                  //TESTING auth support
            var ref2 = new Firebase(numUrl);
            $scope.secondObj = $firebaseObject(ref2);
            $scope.secondObj.$loaded().then(function() {
                $scope.num = $scope.secondObj.num;
                var addUrl = "https://blistering-heat-6128.firebaseio.com/Users/" +userName+ "/ExportQueue/" + $scope.num;                  //TESTING auth support
                var queueAdd = new Firebase(addUrl);
                queueAdd.set(horse);

                $scope.num += 1;
                //var numberUrl = "https://blistering-heat-6128.firebaseio.com/ExportNum/num";
                var numberUrl = "https://blistering-heat-6128.firebaseio.com/Users/" +userName+ "/ExportNum/num";                                          //TESTING auth support
                var updateNum = new Firebase(numberUrl);
                updateNum.set($scope.num);
                alert("Horse Added!");
            });
        });

    }


}]);

app.controller('PriceController', ['$scope', '$firebaseArray', '$window', '$http','$firebaseObject', 'Auth',function($scope, $firebaseArray, $window, $http,$firebaseObject, Auth) {
//Firebase.enableLogging(true);
    
    var authRef = new Firebase("https://blistering-heat-6128.firebaseio.com");
    authDataObj = authRef.getAuth();                                                                                 //Literally death.
    userName = authDataObj.uid;

    
    //var myHorses = new Firebase('https://blistering-heat-6128.firebaseio.com/horses');                                             //Enable to use single user mode.
	var myVaccines = new Firebase('https://blistering-heat-6128.firebaseio.com/Users/'+userName+'/vaccines');
    $scope.vaccines = $firebaseArray(myVaccines);
	
    var myHorses = new Firebase('https://blistering-heat-6128.firebaseio.com/Users/' + userName + '/horses');         //TESTING auth suport
    
    $scope.horses = $firebaseArray(myHorses);
    $scope.back = function() {

        $window.location.href = '/MainPage.html';
    };
    $scope.showForm = function(){
        $window.location.href = '/horseForm.html';
    };

    $scope.hideForm = function() {
        $scope.addFormShow = false;
    };
	
	$scope.total = function() {
		var total = 0;
		for(var i = 0; i < $scope.horses.length; i++){
			var product = $scope.horses[i];
            if (typeof product.auctionPrice === "string") {
                total += parseInt(product.auctionPrice);
            }
            else {
                total += product.auctionPrice;
            }
		}
		return total;
	}
	
	$scope.horseTotal = function(name) {
		var total = 0;
		for(var i = 0; i < $scope.horses.length; i++){
			if ($scope.horses[i].name == name) {
				var product = $scope.horses[i];
				var vac1 = product.vaccines.split("|");
				for (var j = 0; j < $scope.vaccines.length; j++) {
					for (var k = 0; k < vac1.length; k++) {
						if (vac1[k] == $scope.vaccines[j].name) {
							//console.log($scope.vaccines[j].name);
							//console.log($scope.vaccines[j].price);
							if (typeof $scope.vaccines[j].price === "string") {
								total += parseInt($scope.vaccines[j].price);
							}
							else {
								total += $scope.vaccines[j].price;
							}
						}
					}
				}
			}
		}
		return total;
	}
	
	$scope.vaccineTotal = function() {
		var total = 0;
		for(var i = 0; i < $scope.horses.length; i++){
			var product = $scope.horses[i];
			var vac1 = product.vaccines.split("|");
			for (var j = 0; j < $scope.vaccines.length; j++) {
				for (var k = 0; k < vac1.length; k++) {
					if (vac1[k] == $scope.vaccines[j].name) {
						if (typeof $scope.vaccines[j].price === "string") {
							total += parseInt($scope.vaccines[j].price);
						}
						else {
							total += $scope.vaccines[j].price;
						}
					}
				}
			}
		}
		return total;
	}
	
	$scope.createExcelSheet = function() {
		var array = [];
		for (var i = 0; i < $scope.horses.length; i++) {
			array.push({
				"Name": $scope.horses[i].name,
				"Auction Price": "$" + $scope.horses[i].auctionPrice,
				"Expenditures": "$" + $scope.horseTotal($scope.horses[i].name)
			});
		}
		var j = JSON.stringify(array);
		JSONToCSVConvertor(j, "Financial Report", true);
	}
	
	function JSONToCSVConvertor(JSONData, ReportTitle, ShowLabel) {
    //If JSONData is not an object then JSON.parse will parse the JSON string in an Object
    var arrData = typeof JSONData != 'object' ? JSON.parse(JSONData) : JSONData;
    
    var CSV = '';    
    //Set Report title in first row or line
    
    CSV += ReportTitle + '\r\n\n';

    //This condition will generate the Label/Header
    if (ShowLabel) {
        var row = "";
        
        //This loop will extract the label from 1st index of on array
        for (var index in arrData[0]) {
            
            //Now convert each value to string and comma-seprated
            row += index + ',';
        }

        row = row.slice(0, -1);
        
        //append Label row with line break
        CSV += row + '\r\n';
    }
    
    //1st loop is to extract each row
    for (var i = 0; i < arrData.length; i++) {
        var row = "";
        
        //2nd loop will extract each column and convert it in string comma-seprated
        for (var index in arrData[i]) {
            row += '"' + arrData[i][index] + '",';
        }

        row.slice(0, row.length - 1);
        
        //add a line break after each row
        CSV += row + '\r\n';
    }
	
	CSV += "TOTAL:" + ",$" + $scope.total() + ",$" + $scope.vaccineTotal() + '\r\n';
	console.log(CSV);

    if (CSV == '') {        
        alert("Invalid data");
        return;
    }   
    
    //Generate a file name
    var fileName = "";
    //this will remove the blank-spaces from the title and replace it with an underscore
    fileName += ReportTitle.replace(/ /g,"_");   
    
    //Initialize file format you want csv or xls
    var uri = 'data:text/csv;charset=utf-8,' + escape(CSV);
    
    // Now the little tricky part.
    // you can use either>> window.open(uri);
    // but this will not work in some browsers
    // or you will not get the correct file extension    
    
    //this trick will generate a temp <a /> tag
    var link = document.createElement("a");    
    link.href = uri;
    
    //set the visibility hidden so it will not effect on your web-layout
    link.style = "visibility:hidden";
    link.download = fileName + ".csv";
    
    //this part will append the anchor tag and remove it after automatic click
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
	
	
    $scope.edit = function(name) {
        
        var reqUrl = 'https://blistering-heat-6128.firebaseio.com/Users/' + userName + '/Requests/one';
        var request = new Firebase(reqUrl);
        request.set(name);
        $window.location.href = '/editHorse.html';
    };
    $scope.goToHorseProfile = function(name) {
        var reqUrl1 = 'https://blistering-heat-6128.firebaseio.com/Users/' + userName + '/HorseRequests/one';        //TESTING auth support
        console.log(reqUrl1);
        var request1 = new Firebase(reqUrl1);
        request1.set(name);

        $window.location.href = '/horseProfile.html';
    };
    function clearForm(){
        $scope.name='';
        $scope.gender='';
        $scope.breed='';
        $scope.weight='';
        $scope.dob='';
        $scope.sire='';
        $scope.mare='';
        $scope.auctionPrice='';
    };
    $scope.removeHorse = function(horse) {
        //var urlAdd = 'https://blistering-heat-6128.firebaseio.com/horses/';
        if (!confirm("Are you sure you want to remove this horse permanently?")) {
            return;   
        }
        var urlAdd = 'https://blistering-heat-6128.firebaseio.com/Users/' + userName +'/horses/';                          //TESTING auth support
        var authenticatedUsersAdd = new Firebase(urlAdd);
        authenticatedUsersAdd.child(horse.name).remove(function(response) {
            //$window.location.href = '/horseDatabase.html';
        });
    }
    $scope.addToQueue = function(name) {
        //var url = "https://blistering-heat-6128.firebaseio.com/horses/" + name + ".json";
        var url = "https://blistering-heat-6128.firebaseio.com/Users/" +userName+ "/horses/" + name;                            //TESTING auth support
        var ref = new Firebase(url);
        $scope.returnedObj = $firebaseObject(ref);
        $scope.returnedObj.$loaded().then(function () {

            var horse = {
                    "name": $scope.returnedObj.name,
                    "gender": $scope.returnedObj.gender,
                    "breed": $scope.returnedObj.breed,
                    "weight": $scope.returnedObj.weight,
                    "dob": $scope.returnedObj.dob,
                    "sire": $scope.returnedObj.sire,
                    "mare": $scope.returnedObj.mare,
                    "auctionPrice": $scope.returnedObj.auctionPrice,
                    "notes": $scope.returnedObj.notes,
                    "vaccines": $scope.returnedObj.vaccines,
                    "image": $scope.returnedObj.image,
            };

            var numUrl = "https://blistering-heat-6128.firebaseio.com/Users/" +userName+ "/ExportNum";                                  //TESTING auth support
            var ref2 = new Firebase(numUrl);
            $scope.secondObj = $firebaseObject(ref2);
            $scope.secondObj.$loaded().then(function() {
                $scope.num = $scope.secondObj.num;
                var addUrl = "https://blistering-heat-6128.firebaseio.com/Users/" +userName+ "/ExportQueue/" + $scope.num;                  //TESTING auth support
                var queueAdd = new Firebase(addUrl);
                queueAdd.set(horse);

                $scope.num += 1;
                //var numberUrl = "https://blistering-heat-6128.firebaseio.com/ExportNum/num";
                var numberUrl = "https://blistering-heat-6128.firebaseio.com/Users/" +userName+ "/ExportNum/num";                                          //TESTING auth support
                var updateNum = new Firebase(numberUrl);
                updateNum.set($scope.num);
                alert("Horse Added!");
            });
        });

    }


}]);

app.controller('vaccineDatabaseCtrl', ['$scope', '$firebaseArray', '$window', '$http','$firebaseObject', 'Auth', function($scope, $firebaseArray,$window, $http,$firebaseObject, Auth) {

    //Firebase.enableLogging(debugMode);
    
    var authRef = new Firebase("https://blistering-heat-6128.firebaseio.com");
    authDataObj = authRef.getAuth();                                                                                 //Literally death.
    userName = authDataObj.uid;

    
    //var myVaccines = new Firebase('https://blistering-heat-6128.firebaseio.com/vaccines');
    var myVaccines = new Firebase('https://blistering-heat-6128.firebaseio.com/Users/'+userName+'/vaccines');
    $scope.vaccines = $firebaseArray(myVaccines);

    $scope.addVaccine =function() {
        $window.location.href = '/vaccineForm.html';
    };
    $scope.edit = function(name) {
        var reqUrl1 = 'https://blistering-heat-6128.firebaseio.com/Users/' +userName+ '/VaccineEditRequests/one';
        var request1 = new Firebase(reqUrl1);
        request1.set(name);
        $window.location.href = '/editVaccine.html';
    };
    $scope.goToVaccProfile = function(name){
        var reqUrl = 'https://blistering-heat-6128.firebaseio.com/Users/' + userName + '/VaccineRequests/one';
        var request = new Firebase(reqUrl);
        request.set(name);
        $window.location.href = '/vaccineProfile.html';
    }
    $scope.removeVaccine = function(vaccine) {
        //var urlAdd = 'https://blistering-heat-6128.firebaseio.com/vaccines/';
        if (!confirm("Are you sure you want to remove this vaccine permanently?")) {
            return;   
        }
        var urlAdd = 'https://blistering-heat-6128.firebaseio.com/Users/' +userName+ '/vaccines/';
        var authenticatedUsersAdd = new Firebase(urlAdd);
        authenticatedUsersAdd.child(vaccine.name).remove(function(response) {
            //$window.location.href = '/vaccineDatabase.html';
        });
        //
    }
    $scope.addVaccine = function(){
        $window.location.href = '/vaccineForm.html';
    }
    $scope.back = function() {
        $window.location.href = '/MainPage.html';
    }
    $scope.addToQueue = function(name) {
        var url = "https://blistering-heat-6128.firebaseio.com/Users/"+userName+"/vaccines/" + name;
        var ref = new Firebase(url);
		$scope.returnedObj = $firebaseObject(ref);
		$scope.returnedObj.$loaded().then(function() {
			$scope.queueParams = $scope.returnedObj;

            var vaccine = {
                    "name": $scope.queueParams.name,
                    "description": $scope.queueParams.description,
                    "instruction": $scope.queueParams.instruction,
                    "seller": $scope.queueParams.seller,
                    "price": $scope.queueParams.price,
                };
            var numUrl = "https://blistering-heat-6128.firebaseio.com/Users/" +userName+ "/ExportNum"
            var ref2 = new Firebase(numUrl);
			$scope.secondObj = $firebaseObject(ref2);
			$scope.secondObj.$loaded().then(function() {
				$scope.num = $scope.secondObj.num;
                var addUrl = "https://blistering-heat-6128.firebaseio.com/Users/"+userName+"/ExportQueue/" + $scope.num;
                var queueAdd = new Firebase(addUrl);
                queueAdd.set(vaccine);

                $scope.num += 1;
                //var numberUrl = "https://blistering-heat-6128.firebaseio.com/ExportNum/num";
                var numberUrl = "https://blistering-heat-6128.firebaseio.com/Users/" +userName+ "/ExportNum/num";
                var updateNum = new Firebase(numberUrl);
                updateNum.set($scope.num);
                alert("Vaccine Added!");
			});  
		});
    }
}]);

app.controller('VaccineProfileController', ['$scope', '$firebaseArray','Auth', '$window','$firebaseObject', '$http',function($scope, $firebaseArray, Auth,$window,$firebaseObject, $http) {
    
    //Firebase.enableLogging(debugMode);
    var authRef = new Firebase("https://blistering-heat-6128.firebaseio.com");
    authDataObj = authRef.getAuth();                                                                                 //Literally death.
    userName = authDataObj.uid;
    var ref = new Firebase("https://blistering-heat-6128.firebaseio.com/Users/"+userName+"/VaccineRequests");
    $scope.returnedObj = $firebaseObject(ref);
    $scope.returnedObj.$loaded().then(function () {
        $scope.searchName = $scope.returnedObj.one;
        var url = "https://blistering-heat-6128.firebaseio.com/Users/"+userName+"/vaccines/" + $scope.searchName;
        var reqUrl = 'https://blistering-heat-6128.firebaseio.com/Users/'+userName+'/VaccineEditRequests/one';
        var request = new Firebase(reqUrl);
        request.set($scope.searchName);
        var ref2 = new Firebase(url);
        $scope.secondObj = $firebaseObject(ref2);
        $scope.secondObj.$loaded().then(function () {
            $scope.params = $scope.secondObj;
        });
    });

    $scope.removeVaccine = function() {
        
        //alert("Vaccine Removed!");
        if (!confirm("Are you sure you want to remove this vaccine permanently?")) {
            return;   
        }
        var urlAdd = 'https://blistering-heat-6128.firebaseio.com/Users/'+userName+'/vaccines/';
        var authenticatedUsersAdd = new Firebase(urlAdd);
        authenticatedUsersAdd.child($scope.searchName).remove(function(response) {
            $window.location.href = '/vaccineDatabase.html';
        });
        //
    }
    $scope.edit = function() {
        $window.location.href = '/editVaccine.html';  
    };
    $scope.toDatabase = function() {
        $window.location.href = '/vaccineDatabase.html';
    };
    $scope.mainPage = function() {
        $window.location.href = '/MainPage.html';
    }
    
}]);

app.controller('horseEditController', [ '$scope', '$firebaseArray','Auth', '$http','$firebaseObject', '$window', function ($scope, $firebaseArray, Auth, $http,$firebaseObject, $window) {
    // comment to check sync
    //Firebase.enableLogging(debugMode);
    var authRef = new Firebase("https://blistering-heat-6128.firebaseio.com");
    authDataObj = authRef.getAuth();                                                                                 //Literally death.
    userName = authDataObj.uid;
    var url = 'https://blistering-heat-6128.firebaseio.com/Users/'+userName+'/horses';
    var horses = new Firebase(url);
    $scope.horses = $firebaseArray(horses);
    $scope.loadFile = function () {
        var output = document.getElementById('output');
        var d = document.querySelector('input[type=file]').files[0];
        var reader = new FileReader();
        var dataurl;
        reader.readAsDataURL(d);
        reader.addEventListener("load", function() {
            dataurl = reader.result;
            output.src = dataurl;
        }, false);
    };
    $scope.showSpan = 0;
    $scope.show = function() {
        return $scope.showSpan;
    };
    $scope.initial = function(image) {
        console.log(image);
        var output = document.getElementById('output');
        output.src = image;
       if (image.length > 0) {
            $scope.showSpan = 1;
        }
    };
    $window.onclick = function(event) {
        var modal = document.getElementById("vaccineModal");
        var trainingModal = document.getElementById("trainingModal");
        var interior = document.getElementById("vaccineModalInterior");
        var allItems = document.getElementById("all");
        if (event.target == allItems) {
            modal.style.display = "none";
            trainingModal.style.display = "none";
        }
    }
    var vaccinesInHorseForm = new Firebase('https://blistering-heat-6128.firebaseio.com/Users/'+userName+'/vaccines');              //Needed to populate vaccubes in horseForm
    $scope.vaccines = $firebaseArray(vaccinesInHorseForm);
    var regimensInHorseForm = new Firebase('https://blistering-heat-6128.firebaseio.com/Users/'+userName+'/regimens');
    $scope.regimens = $firebaseArray(regimensInHorseForm);
    $scope.addVaccineToHorse = function(vaccineName){

        if ($scope.vacList.indexOf(vaccineName) == -1)
            $scope.vacList.push(vaccineName);
        var list = document.getElementById("list");
        list.innerHTML = "<table class=\"table\"><thead></thead><tbody>";
        for (var i = 0; i < $scope.vacList.length; i++) {
            list.innerHTML += "<tr><td>" + $scope.vacList[i] + "</td></tr><hr>";
        }
        list.innerHTML += "</tbody></table>";

        $scope.vaccineList = "";
         for (var i = 0; i < $scope.vacList.length; i++) {

            if ( i == $scope.vacList.length - 1) {
                $scope.vaccineList += $scope.vacList[i];
            }
            else {
                $scope.vaccineList += $scope.vacList[i] + "|";
            }
        }

        var urlAdd = 'https://blistering-heat-6128.firebaseio.com/Users/'+userName+'/vacsToBeAdded';
        var authenticatedUsersAdd = new Firebase(urlAdd);
        authenticatedUsersAdd.set($scope.vaccineList);
        //TODO: Add vacList to createHorse under "vaccines": json key. Format if necessary.
    }
    $scope.addTrainingToHorse = function(trainingName) {
        if ($scope.trainingList.indexOf(trainingName) == -1)
            $scope.trainingList.push(trainingName);
        var list = document.getElementById("trainingList");
        list.innerHTML = "<table class=\"table\"><thead></thead><tbody>";
        for (var i = 0; i < $scope.trainingList.length; i++) {
            list.innerHTML += "<tr><td>" + $scope.trainingList[i] + "</td></tr><hr>";
        }
        list.innerHTML += "</tbody></table>";

        $scope.trainingString = "";
         for (var i = 0; i < $scope.trainingList.length; i++) {
            if ( i == $scope.trainingList.length - 1) {
                $scope.trainingString += $scope.trainingList[i];
            }
            else {
                $scope.trainingString += $scope.trainingList[i] + "|";
            }
        }

        var urlAdd = 'https://blistering-heat-6128.firebaseio.com/Users/'+userName+'/trainingToBeAdded';
        var authenticatedUsersAdd = new Firebase(urlAdd);
        authenticatedUsersAdd.set($scope.trainingString);
    }
    $scope.removeTrainingFromHorse = function(trainingName){

        for(var i=$scope.trainingList.length-1; i>=0; i--) {
            if ($scope.trainingList[i] === trainingName) {
                $scope.trainingList.splice(i, 1);
                // break;       //<-- Uncomment  if only the first term has to be removed
            }
        }
        var list = document.getElementById("trainingList");
        list.innerHTML = "<table class=\"table\"><thead></thead><tbody>";
        for (var i = 0; i < $scope.trainingList.length; i++) {
            list.innerHTML += "<tr><td>" + $scope.trainingList[i] + "</td></tr><hr>";
        }
        list.innerHTML += "</tbody></table>";

        $scope.trainingString = "";
         for (var i = 0; i < $scope.trainingList.length; i++) {
            if ( i == $scope.trainingList.length - 1) {
                $scope.trainingString += $scope.trainingList[i];
            }
            else {
                $scope.trainingString += $scope.trainingList[i] + "|";
            }
        }

        var urlAdd = 'https://blistering-heat-6128.firebaseio.com/Users/'+userName+'/trainingToBeAdded';
        var authenticatedUsersAdd = new Firebase(urlAdd);
        authenticatedUsersAdd.set($scope.trainingString);
    }  
    $scope.removeVaccineFromHorse = function(vaccineNameToRemove){

        for(var i=$scope.vacList.length-1; i>=0; i--) {
            if ($scope.vacList[i] === vaccineNameToRemove) {
                $scope.vacList.splice(i, 1);
                // break;       //<-- Uncomment  if only the first term has to be removed
            }
        }
        var list = document.getElementById("list");
        list.innerHTML = "<table class=\"table\"><thead></thead><tbody>";
        for (var i = 0; i < $scope.vacList.length; i++) {
            list.innerHTML += "<tr><td>" + $scope.vacList[i] + "</td></tr><hr>";
        }
        list.innerHTML += "</tbody></table>";

        $scope.vaccineList = "";
         for (var i = 0; i < $scope.vacList.length; i++) {
            if ( i == $scope.vacList.length - 1) {
                $scope.vaccineList += $scope.vacList[i];
            }
            else {
                $scope.vaccineList += $scope.vacList[i] + "|";
            }
        }

        var urlAdd = 'https://blistering-heat-6128.firebaseio.com/Users/'+userName+'/vacsToBeAdded';
        var authenticatedUsersAdd = new Firebase(urlAdd);
        authenticatedUsersAdd.set($scope.vaccineList);
        //TODO: Add vacList to createHorse under "vaccines": json key. Format if necessary.
    }
    $scope.openModal = function() {
        var modal = document.getElementById("vaccineModal");
        modal.style.display = "block";
    }
    $scope.openTrainingModal = function() {
        var modal = document.getElementById("trainingModal");
        modal.style.display = "block";
    }
    $scope.closeModal = function() {
        var modal = document.getElementById("vaccineModal");
        modal.style.display = "none";
    }
    $scope.closeTrainingModal = function() {
        var modal = document.getElementById("trainingModal");
        modal.style.display= "none";
    }
    
    var ref = new Firebase("https://blistering-heat-6128.firebaseio.com/Users/"+userName+"/Requests")
    $scope.returnedObj = $firebaseObject(ref);
    $scope.returnedObj.$loaded().then(function () {

        $scope.searchName = $scope.returnedObj.one;

        var url = "https://blistering-heat-6128.firebaseio.com/Users/"+userName+"/horses/" + $scope.searchName;
        var reqUrl = 'https://blistering-heat-6128.firebaseio.com/Users/'+userName+'/HorseRequests/one';
        var request = new Firebase(reqUrl);

        request.set($scope.searchName);
        var ref2 = new Firebase(url);
        $scope.secondObj = $firebaseObject(ref2);
        $scope.secondObj.$loaded().then(function() {
            $scope.params = $scope.secondObj;
            document.getElementById("name").value = $scope.params.name;
            document.getElementById("breed").value = $scope.params.breed;
            if($scope.params.gender.localeCompare("Male") == 0)
                document.getElementById("gender").selectedIndex = 1;
            else
                document.getElementById("gender").selectedIndex = 2;
            if (!$scope.params.notes) {
                $scope.params.notes = "";
            }
            document.getElementById("price").value = parseInt($scope.params.auctionPrice);
            document.getElementById("weight").value = parseInt($scope.params.weight);
            document.getElementById("dob").value = $scope.params.dob;
            document.getElementById("mare").value = $scope.params.mare;
            document.getElementById("sire").value = $scope.params.sire;
            document.getElementById("notes").value = $scope.params.notes;
            $scope.horseName = $scope.params.name;
            $scope.horseBreed = $scope.params.breed;
            $scope.horseGender = $scope.params.gender;
            $scope.horsePrice = $scope.params.auctionPrice;
            $scope.horseWeight = $scope.params.weight;
            $scope.horseDOB = $scope.params.dob;
            $scope.horseMare = $scope.params.mare;
            $scope.horseSire = $scope.params.sire;
            $scope.notes = $scope.params.notes;
            $scope.vaccineList = $scope.params.vaccines;
            $scope.vacList =$scope.vaccineList.split("|");
            $scope.trainingString = $scope.params.training;
            $scope.trainingList = $scope.trainingString.split("|");
            $scope.initial($scope.params.image);
            var urlAdd = 'https://blistering-heat-6128.firebaseio.com/Users/'+userName+'/vacsToBeAdded';
            var authenticatedUsersAdd = new Firebase(urlAdd);
            authenticatedUsersAdd.set($scope.vaccineList);
            var urlAdd = 'https://blistering-heat-6128.firebaseio.com/Users/'+userName+'/trainingToBeAdded';
            var authenticatedUsersAdd = new Firebase(urlAdd);
            authenticatedUsersAdd.set($scope.trainingString);
            /*
            var reader = new FileReader();
            console.log($scope.params.image);
            reader.readAsDataURL($scope.params.image);
            $scope.image = $scope.params.image;
            console.log($scope.params.image);
            //reader.readAsDataURL($scope.image);
            */
            if ($scope.vacList.length == 1) {
                if ($scope.vacList[0].localeCompare("") == 0) {
                    $scope.vacList = [];
                }
            }
            if ($scope.trainingList.length == 1) {
                if ($scope.trainingList[0].localeCompare("") == 0) {
                    $scope.trainingList = [];
                }
            }
            var list = document.getElementById("list");
            list.innerHTML = "<table class=\"table\"><thead></thead><tbody>";
            for (var i = 0; i < $scope.vacList.length; i++) {
                list.innerHTML += "<tr><td>" + $scope.vacList[i] + "</td></tr><hr>";
            }
            list.innerHTML += "</tbody></table>";
            
            list = document.getElementById("trainingList");
            list.innerHTML = "<table class=\"table\"><thead></thead><tbody>";
            for (var i = 0; i < $scope.trainingList.length; i++) {
                list.innerHTML += "<tr><td>" + $scope.trainingList[i] + "</td></tr><hr>";
            }
            list.innerHTML += "</tbody></table>";
        });
    });
    $scope.$watch('document.getElementById("output").src', function() {
        if (document.getElementById("output").src != "") {
            $scope.horseImageSrc = document.getElementById("output").src;
        }
        
    });
    $scope.createHorse = function () {
        var ref = new Firebase("https://blistering-heat-6128.firebaseio.com/Users/"+userName+"/vacsToBeAdded");
        var ref = new Firebase("https://blistering-heat-6128.firebaseio.com/Users/"+userName);
        var output = document.getElementById('output');
        $scope.cObj = $firebaseObject(ref);
        $scope.cObj.$loaded().then(function() {
            $scope.vaccineList = $scope.cObj.vacsToBeAdded;
            $scope.trainingString = $scope.cObj.trainingToBeAdded;
            var horse = {
                "name": $scope.horseName,
                "gender": $scope.horseGender,
                "breed": $scope.horseBreed,
                "weight": parseInt($scope.horseWeight),
                "dob": $scope.horseDOB,
                "sire": $scope.horseSire,
                "mare": $scope.horseMare,
                "price": parseInt($scope.horsePrice),
                "training": $scope.trainingString,
                "vaccines": $scope.vaccineList,
                "image": output.src,
                "notes": $scope.notes
            };
            if (typeof horse.name != "string" || typeof horse.name === null) {
                alert("Please check the name of the horse");
            }
            else if (typeof horse.gender != "string" || typeof horse.gender === null) {
                alert("Please check the gender of the horse");
            }
            else if (typeof horse.breed != "string" || typeof horse.breed === null) {
                alert("Please check the breed of the horse");
            }
            else if (typeof horse.weight != "number" || typeof horse.weight === null || horse.weight < 0) {
                alert("Please check the weight of the horse");
                console.log(typeof horse.weight);
                console.log(horse.weight);
                console.log($scope.horseWeight);
            }
            else if (typeof horse.sire != "string" || typeof horse.sire === null) {
                alert("Please check the sire of the horse");
            }
            else if (typeof horse.mare != "string" || typeof horse.mare === null) {
                alert("Please check the mare of the horse");
            }
            else if (typeof horse.price != "number" || typeof horse.price === null || horse.price < 0) {
                alert("Please check the price of the horse");
                console.log(typeof horse.price);
                console.log(horse.price);
                console.log($scope.horsePrice);
            }
            else {
                if (typeof horse.dob === "undefined") {
                    horse.dob = "";

                }
                if (typeof horse.vaccines === "undefined") {
                    horse.vaccines = "";
                }
                if (typeof horse.training === "undefined") {
                    horse.training = "";
                }
                if (typeof horse.notes === "undefined") {
                    horse.notes = "";
                }
                if (typeof horse.image === "undefined") {
                    horse.image = "";
                }
                if (horse.image.indexOf(".html") > -1) {
                    horse.image = "";
                }
                var urlAdd = 'https://blistering-heat-6128.firebaseio.com/Users/'+userName+'/horses/' + horse.name;
                var authenticatedUsersAdd = new Firebase(urlAdd);
                authenticatedUsersAdd.set({
                    name:horse.name,
                    gender:horse.gender,
                    breed:horse.breed,
                    weight:horse.weight,
                    dob:horse.dob,
                    sire:horse.sire,
                    mare:horse.mare,
                    auctionPrice:horse.price,
                    notes:horse.notes,
                    training:horse.training,
                    vaccines:horse.vaccines,
                    image:horse.image
                });
                //$scope.resetFields();
                $window.location.href = '/horseProfile.html';
            }
        });
    }
}]);

app.controller('TrainingCtrl', ['$scope', '$firebaseArray', '$window', '$http','$firebaseObject', 'Auth', function($scope, $firebaseArray, $window, $http,$firebaseObject, Auth) {

    var authRef = new Firebase("https://blistering-heat-6128.firebaseio.com");
    authDataObj = authRef.getAuth();                                                                                 //Literally death.
    userName = authDataObj.uid;

    
    //Firebase.enableLogging(debugMode);
    //var myHorses = new Firebase('https://blistering-heat-6128.firebaseio.com/regimens');
    var myHorses = new Firebase('https://blistering-heat-6128.firebaseio.com/Users/' +userName+ '/regimens');
    $scope.regimens = $firebaseArray(myHorses);
    $scope.back = function() {

        $window.location.href = '/MainPage.html';
    };
    $scope.addForm = function(){
        $window.location.href = '/trainingForm.html';
    };
    $scope.edit = function(name) {
        var reqUrl1 = 'https://blistering-heat-6128.firebaseio.com/Users/' +userName+ '/TrainingRequests/one';
        var request1 = new Firebase(reqUrl1);
        request1.set(name);
        $window.location.href = '/editTraining.html';
    };
    $scope.goToRegimeProfile = function(name) {
        var reqUrl = 'https://blistering-heat-6128.firebaseio.com/Users/' + userName + '/TrainingProfileRequests/one';
        var request = new Firebase(reqUrl);
        request.set(name);

        $window.location.href = '/trainingProfile.html';
    };
    function clearForm(){
        $scope.name='';
        $scope.location='';
        $scope.food='';
        $scope.exercise='';
        $scope.equipment='';
        
    };
    $scope.removeRegime = function(regime) {
        //var urlAdd = 'https://blistering-heat-6128.firebaseio.com/regimens/';
        if (!confirm("Are you sure you want to remove this horse permanently?")) {
            return;   
        }
        var urlAdd = 'https://blistering-heat-6128.firebaseio.com/Users/' +userName+ '/regimens/';
        var authenticatedUsersAdd = new Firebase(urlAdd);
        authenticatedUsersAdd.child(regime.name).remove(function(response) {
            //$window.location.href = '/horseDatabase.html';
        });
    }
    $scope.addToQueue = function(name) {
        //var url = "https://blistering-heat-6128.firebaseio.com/regimens/" + name + ".json";
        var url = "https://blistering-heat-6128.firebaseio.com/Users/" +userName+ "/regimens/" + name;
        var ref = new Firebase(url);
		$scope.returnedObj = $firebaseObject(ref);
		$scope.returnedObj.$loaded().then(function () {
			$scope.queueParams = $scope.returnedObj;
            var regimen = {
                    "name": $scope.queueParams.name,
                    "exercise": $scope.queueParams.exercise,
                    "food": $scope.queueParams.food,
                    "location": $scope.queueParams.location,
                    "equipment": $scope.queueParams.equipment,
            };
            var numUrl = "https://blistering-heat-6128.firebaseio.com/Users/"+userName+ "/ExportNum";
            var ref2 = new Firebase(numUrl);
			$scope.secondObj = $firebaseObject(ref2);
			$scope.secondObj.$loaded().then(function () {
				$scope.num = $scope.secondObj.num;
                var addUrl = "https://blistering-heat-6128.firebaseio.com/Users/" +userName+ "/ExportQueue/" + $scope.num;
                var queueAdd = new Firebase(addUrl);
                queueAdd.set(regimen);
                $scope.num += 1;
                var numberUrl = "https://blistering-heat-6128.firebaseio.com/Users/" +userName+ "/ExportNum/num";
                var updateNum = new Firebase(numberUrl);
                updateNum.set($scope.num);
                alert("Training Program Added!");
			});
		});
    }

}]);

app.controller('RegimeController', ['$scope', '$firebaseArray','Auth', '$window','$firebaseObject', '$http',function($scope, $firebaseArray,Auth, $window,$firebaseObject, $http) {
    var authRef = new Firebase("https://blistering-heat-6128.firebaseio.com");
    authDataObj = authRef.getAuth();                                                                                 //Literally death.
    userName = authDataObj.uid;
    
        
    //Firebase.enableLogging(debugMode);
    var ref = new Firebase("https://blistering-heat-6128.firebaseio.com/Users/"+userName+"/TrainingProfileRequests");
    $scope.returnedObj = $firebaseObject(ref);
    $scope.returnedObj.$loaded().then(function () {
        $scope.searchName = $scope.returnedObj.one;
        var reqUrl = 'https://blistering-heat-6128.firebaseio.com/Users/'+userName+'/TrainingRequests/one';
        var request = new Firebase(reqUrl);
        request.set($scope.searchName);
        var url = "https://blistering-heat-6128.firebaseio.com/Users/"+userName+"/regimens/" + $scope.searchName;
        var ref2 = new Firebase(url);
        $scope.secondObj = $firebaseObject(ref2);
        $scope.secondObj.$loaded().then(function () {
            $scope.params = $scope.secondObj;
        });

    });
    $scope.removeRegime = function() {
        //alert("Regime Removed!");
        if (!confirm("Are you sure you want to remove this training regimen permanently?")) {
            return;
        }
        var urlAdd = 'https://blistering-heat-6128.firebaseio.com/Users/'+userName+'/regimens/';
        var authenticatedUsersAdd = new Firebase(urlAdd);
        authenticatedUsersAdd.child($scope.searchName).remove(function(response) {
            $window.location.href = '/trainingDatabase.html';
        });
    }
    $scope.edit = function() {
        $window.location.href = '/editTraining.html';
    };
    $scope.toDatabase = function() {
        $window.location.href = '/trainingDatabase.html';
    };
    $scope.mainPage = function() {
        $window.location.href = '/MainPage.html';
    }
    
}]);

app.controller('vaccineEditController', [ '$scope', '$firebaseArray','Auth', '$http','$firebaseObject', '$window', function ($scope, $firebaseArray,Auth, $http,$firebaseObject, $window) {
    
    //Firebase.enableLogging(debugMode);
    // comment to check sync
    var authRef = new Firebase("https://blistering-heat-6128.firebaseio.com");
    authDataObj = authRef.getAuth();                                                                                 //Literally death.
    userName = authDataObj.uid;
    var url = 'https://blistering-heat-6128.firebaseio.com/Users/'+userName+'/vaccines';
    var vaccines = new Firebase(url);
    $scope.vaccines = $firebaseArray(vaccines);
    var ref = new Firebase("https://blistering-heat-6128.firebaseio.com/Users/"+userName+"/VaccineEditRequests");
    $scope.returnedObj = $firebaseObject(ref);
    $scope.returnedObj.$loaded().then(function () {
        $scope.searchName = $scope.returnedObj.one;
        var url = "https://blistering-heat-6128.firebaseio.com/Users/"+userName+"/vaccines/" + $scope.searchName;
        var reqUrl = 'https://blistering-heat-6128.firebaseio.com/Users/'+userName+'/VaccineRequests/one';
        var request = new Firebase(reqUrl);
        request.set($scope.searchName);
        var ref2 = new Firebase(url);
        $scope.secondObj = $firebaseObject(ref2);
        $scope.secondObj.$loaded().then(function () {
            $scope.params = $scope.secondObj;

            document.getElementById("vaccineName").value = $scope.params.name;
            document.getElementById("vaccineDescription").value = $scope.params.description;
            document.getElementById("vaccineInstructions").value = $scope.params.instruction;
            document.getElementById("vaccineSeller").value = $scope.params.seller;
            document.getElementById("vaccinePrice").value = $scope.params.price;
            $scope.vaccineName = $scope.params.name;
            $scope.vaccineDescription = $scope.params.description;
            $scope.vaccineInstructions = $scope.params.instruction;
            $scope.vaccineSeller = $scope.params.seller;
            $scope.vaccinePrice = $scope.params.price;
        });

    });

    
    $scope.createVaccine = function () {
        var vaccine = {
            "name": $scope.vaccineName,
            "description": $scope.vaccineDescription,
            "instruction": $scope.vaccineInstructions,
            "seller": $scope.vaccineSeller,
            "price": $scope.vaccinePrice,
        };

        if (typeof vaccine.name != "string" || typeof vaccine.name === null) {
            alert("Please provide a valid vaccine name");
        }
        else if (typeof vaccine.seller != "string" || typeof vaccine.seller === null) {
            alert("Please provide valid seller info");
        }
        else if (typeof vaccine.price != "number" || typeof vaccine.price === null || vaccine.price < 0) {
            alert("Please provide a valid price");
        }
        else{
            if (typeof vaccine.description === "undefined") {
                vaccine.description = "";
            }
            if (typeof vaccine.instruction === "undefined") {
                vaccine.instruction = "";
            }
            var urlAdd = 'https://blistering-heat-6128.firebaseio.com/Users/'+userName+'/vaccines/' + vaccine.name;
            var vaccinesAdd = new Firebase(urlAdd);
            vaccinesAdd.set(vaccine);
            $window.location.href = '/vaccineProfile.html';
        }

    };
    
}]);

app.controller('trainingEditController', [ '$scope', '$firebaseArray','Auth', '$http','$firebaseObject', '$window', function ($scope, $firebaseArray, Auth, $http,$firebaseObject, $window) {
    //Firebase.enableLogging(debugMode);
    // comment to check sync
    var authRef = new Firebase("https://blistering-heat-6128.firebaseio.com");
    authDataObj = authRef.getAuth();                                                                                 //Literally death.
    userName = authDataObj.uid;
    
    var url = 'https://blistering-heat-6128.firebaseio.com/Users/'+userName+'/regimens';
    var regimens = new Firebase(url);
    $scope.regimens = $firebaseArray(regimens);
    var ref = new Firebase("https://blistering-heat-6128.firebaseio.com/Users/"+userName+"/TrainingRequests");
    $scope.returnedObj = $firebaseObject(ref);
    $scope.returnedObj.$loaded().then(function () {
        $scope.searchName = $scope.returnedObj.one;
        var url = "https://blistering-heat-6128.firebaseio.com/Users/"+userName+"/regimens/" + $scope.searchName;
        var reqUrl = 'https://blistering-heat-6128.firebaseio.com/Users/'+userName+'/TrainingProfileRequests/one';
        var request = new Firebase(reqUrl);
        request.set($scope.searchName);
        var ref2 = new Firebase(url);
        $scope.secondObj = $firebaseObject(ref2);
        $scope.secondObj.$loaded().then(function () {
            $scope.params = $scope.secondObj;
            document.getElementById("trainingExercise").value = $scope.params.exercise;
            document.getElementById("trainingFood").value = $scope.params.food;
            document.getElementById("trainingName").value = $scope.params.name;
            document.getElementById("trainingLocation").value = $scope.params.location;
            document.getElementById("trainingEquipment").value = $scope.params.equipment;
            $scope.trainingExercise = $scope.params.exercise;
            $scope.trainingFood = $scope.params.food;
            $scope.trainingName = $scope.params.name;
            $scope.trainingLocation = $scope.params.location;
            $scope.trainingEquipment = $scope.params.equipment;
        });         
    });
    
    $scope.createRegimen = function () {
        var regimen = {
            "name": $scope.trainingName,
            "exercise": $scope.trainingExercise,
            "food": $scope.trainingFood,
            "location": $scope.trainingLocation,
            "equipment": $scope.trainingEquipment,
        };

        if (typeof regimen.name != "string" || typeof regimen.name=== null) {
            alert("Please provide a valid regimen name");
        }
        else if (typeof regimen.exercise != "string" || typeof regimen.exercise  === null) {
            alert("Please provide a valid exercise");
        }
        else {
            if (typeof regimen.food === "undefined") {
                regimen.food = "";
            }
            if (typeof regimen.location === "undefined") {
                regimen.location = "";
            }
            if (typeof regimen.equipment=== "undefined") {
                regimen.equipment = "";
            }

            var urlAdd = 'https://blistering-heat-6128.firebaseio.com/Users/'+userName+'/regimens/' + regimen.name;
            var regimensAdd = new Firebase(urlAdd);
            regimensAdd.set(regimen);
            $window.location.href = '/trainingProfile.html';
        }


    };
    
}]);

app.controller('fileUploadController', [ '$scope', '$firebaseArray', '$firebaseObject', '$http', '$window', 'Auth', function ($scope, $firebaseArray,$firebaseObject, $http, $window, Auth) {
    
    //Firebase.enableLogging(debugMode);
    // comment to check sync
    var authRef = new Firebase("https://blistering-heat-6128.firebaseio.com");
    authDataObj = authRef.getAuth();                                                                                 //Literally death.
    userName = authDataObj.uid;
    $scope.wipe = function() {
        $scope.ehorse = [];
        $scope.evaccines = [];
        $scope.eregimens = [];
        var ref = new Firebase("https://blistering-heat-6128.firebaseio.com/Users/"+userName+"/");
        var numReset = {"num": 0};
        ref.child("ExportNum").set(numReset);
        var reset = {"0": "default"}; 
        ref.child("ExportQueue").set(reset);
        alert("Export Queue Reset!");
        document.getElementById("exportModalInterior").innerHTML = "<i><span style='color: #ffffff; font-family: calibri,serif;'><h2>Export Queue</h2></span></i><span style='color: #ffffff; font-family: calibri,serif;'>Export Queue is Empty</span><br><br><button  id='closeExportModal' class='btn btn-primary btn-lg' style='left:50%' onclick=\"getElementById('exportModal').style.display='none'\">Close</button>";
    };
    $scope.linkDownload = function(a, filename, content) {
        contentType =  'data:application/octet-stream,';
        uriContent = contentType + encodeURIComponent(content);
        a.setAttribute('href', uriContent);
        a.setAttribute('download', filename);
      };
            $scope.openExportModal = function() {
            var modal = document.getElementById("exportModal");
            modal.style.display= "block";
        };
        $scope.closeExportModal = function() {
            var modal = document.getElementById("exportModal");
            modal.style.display= "none";
        };
    
        var Eref = new Firebase("https://blistering-heat-6128.firebaseio.com/Users/"+userName+"/ExportQueue");
        $scope.returnedObj = $firebaseObject(Eref);
        $scope.returnedObj.$loaded().then(function() {
            $scope.ehorses = [];
            $scope.evaccines = [];
            $scope.eregimens = [];
            if (typeof $scope.returnedObj[0] === "string") {
               document.getElementById("exportModalInterior").innerHTML = "<i><span style='color: #ffffff; font-family: calibri,serif;'><h2>Export Queue</h2></span></i><span style='color: #ffffff; font-family: calibri,serif;'>Export Queue is Empty</span><br><br><button  id='closeExportModal' class='btn btn-primary btn-lg' style='left:50%' onclick=\"getElementById('exportModal').style.display='none'\">Close</button>";
                return;
            }
            else {
                for (var i = 0; typeof $scope.returnedObj[i] != "undefined"; i++) {
                    if (typeof $scope.returnedObj[i].gender != "undefined") {
                        $scope.ehorses.push($scope.returnedObj[i]);
                    }
                    else if (typeof $scope.returnedObj[i].seller != "undefined") {
                        $scope.evaccines.push($scope.returnedObj[i]);
                    }
                    else {
                        $scope.eregimens.push($scope.returnedObj[i]);
                    }
                }
                console.log($scope.ehorses);
                console.log($scope.evaccines);
                console.log($scope.eregimens);
            }
        });
    $scope.download = function() {
        var content = "error";
        var ref = new Firebase("https://blistering-heat-6128.firebaseio.com/Users/"+userName+"/ExportQueue");
        $scope.returnedObj = $firebaseObject(ref);
        $scope.returnedObj.$loaded().then(function() {
            var horses = [];
            var vaccines = [];
            var regimens = [];
            if (typeof $scope.returnedObj[0] === "string") {
                alert("Export Queue Empty!");
                return;
            }
            for (var i = 0; typeof $scope.returnedObj[i] != "undefined"; i++) {
                if (typeof $scope.returnedObj[i].gender != "undefined") {
                    horses.push($scope.returnedObj[i]);
                }
                else if (typeof $scope.returnedObj[i].seller != "undefined") {
                    vaccines.push($scope.returnedObj[i]);
                }
                else {
                    regimens.push($scope.returnedObj[i]);
                }
            }
            
            //console.log("horses");
            //console.log(horses);
            //console.log("vaccines");
            //console.log(vaccines);
            //console.log("regimens");
            //console.log(regimens);
            var content = "STABLE IMPORT FILE\r\n\r\n";
            for (var i = 0; i < horses.length; i++) {
                if (i == 0) {
                    content += "horses\r\n\r\n";
                }
                console.log("old");
                console.log("training: " + horses[i].training + "end");
                console.log("vaccines: " + horses[i].vaccines + "end");
                console.log("image: " + horses[i].image + "end");
                console.log("notes: " + horses[i].notes + "end");
                if (typeof horses[i].training == "undefined") {
                    horses[i].training = ">";
                }
                if (typeof horses[i].vaccines == "undefined") {
                    horses[i].vaccines = ">";
                }
                if (typeof horses[i].image == "undefined") {
                    horses[i].image = ">";
                }
                if (typeof horses[i].notes == "undefined") {
                    horses[i].notes = ">";
                }
                if (horses[i].image.localeCompare("") == 0) {
                    horses[i].image = ">";
                }
                if (horses[i].training.localeCompare("") == 0) {
                    horses[i].training = ">";
                }
                if (horses[i].vaccines.localeCompare("") == 0) {
                    horses[i].vaccines = ">";
                }
                if (horses[i].notes.localeCompare("") == 0) {
                    horses[i].notes = ">";
                }
                console.log("new");
                console.log("training: " + horses[i].training + "end");
                console.log("vaccines: " + horses[i].vaccines + "end");
                console.log("image: " + horses[i].image + "end");
                console.log("notes: " + horses[i].notes + "end");
                content += horses[i].auctionPrice + "\r\n";
                content += horses[i].breed + "\r\n";
                content += horses[i].dob + "\r\n";
                content += horses[i].gender + "\r\n";
                content += horses[i].image + "\r\n";
                content += horses[i].mare + "\r\n";
                content += horses[i].name + "\r\n";
                content += horses[i].notes + "\r\n";
                content += horses[i].sire + "\r\n";
                content += horses[i].training + "\r\n";
                content += horses[i].vaccines + "\r\n";
                content += horses[i].weight + "\r\n";
                if (i != horses.length - 1) {
                    content += "`\r\n";    
                }
                if ( i == horses.length - 1) {
                    content += "~@\r\n\r\n";
                }
            }
            for (var i = 0; i < vaccines.length; i++) {
                if (i == 0) {
                    content += "vaccines\r\n\r\n";
                }
                content += vaccines[i].description + "\r\n";
                content += vaccines[i].instruction + "\r\n";
                content += vaccines[i].name + "\r\n";
                content += vaccines[i].price + "\r\n";
                content += vaccines[i].seller + "\r\n";
                if (i != vaccines.length - 1) {
                    content += "`\r\n";    
                }
                if ( i == vaccines.length - 1) {
                    content += "~@\r\n\r\n";
                }
            }
            for (var i = 0; i < regimens.length; i++) {
                if (i == 0) {
                    content += "regimens\r\n\r\n";
                }
                content += regimens[i].equipment + "\r\n";
                content += regimens[i].exercise + "\r\n";
                content += regimens[i].food + "\r\n";
                content += regimens[i].location + "\r\n";
                content += regimens[i].name + "\r\n";
                if (i != regimens.length - 1) {
                    content += "`\r\n";    
                }
                if ( i == regimens.length - 1) {
                    content += "~@\r\n\r\n";
                }
            }
            //console.log(content);
            content[content.length-4] = 0;
            var filename = new Date().toISOString() + ".stb";
            var a = document.createElement('a');
            $scope.linkDownload(a, filename, content);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
        
      }
    $scope.generateReport = function(event) {

            var fileName = document.getElementById("myInput").value;
            var ext = getExtension(document.getElementById("myInput").value);
            if (ext.localeCompare("txt") != 0 && ext.localeCompare("stb") != 0) {

                alert("Please select a valid text or STABLE file.");
            }
            else {
                var input = event.target;

                var reader = new FileReader();
                reader.onload = function(){
                    var text = reader.result;
                    $scope.importData = text;
                    var currentWord = "";
                    for (var i = 0, len = $scope.importData.length; i < len; i++) {
                        currentWord+=$scope.importData[i];
                        if (currentWord.localeCompare("horses") == 0) {
                            i += 3;
                            while($scope.importData[i] != '@' && i < len) {
                                i = processHorse(i);
                            }
                            
                        }
                        else if (currentWord.localeCompare("vaccines") == 0) {
                            i += 3;
                            while($scope.importData[i] != '@' && i < len) {
                                i = processVaccines(i);
                            }
                        }
                        else if (currentWord.localeCompare("regimens") == 0) {
                            i += 3;
                            while($scope.importData[i] != '@' && i < len) {
                                i = processTraining(i);
                            }
                        }
                        if ($scope.importData[i] == '\n') {
                            currentWord = "";
                        }
                    }
                    alert("Import Complete!");
                };
                reader.readAsText(input.files[0]); 
                
            }
    };
    function processHorse(ii) {
        var auctionPrice = "";
        var breed = "";
        var DOB = "";
        var gender = "";
        var mare = "";
        var name = "";
        var notes = "";
        var sire = "";
        var weight = "";
        var training = "";
        var vaccines = "";
        var image = "";
        var head = 0;
        //           0             1      2    3       4     5     6      7     8     9        10         11
        var array = [auctionPrice, breed, DOB, gender,image, mare, name, notes, sire, training, vaccines, weight];
        var text = $scope.importData;
        for (var i = ii + 2, len = text.length; i< len; i++) {
            
            if (text[i] == '~') {
                i += 1;
                if (array[10].localeCompare(">") == 0) {
                    array[10] = "";
                }
                if (array[9].localeCompare(">") == 0 ) {
                    array[9] = "";
                }
                if (array[4].localeCompare(">") == 0 ) {
                    array[4] = "";
                }
                var horse = {
                    "name": array[6],
                    "gender": array[3],
                    "breed": array[1],
                    "weight": array[11],
                    "dob": array[2],
                    "sire": array[8],
                    "mare": array[5],
                    "auctionPrice": array[0],
                    "notes": array[7],
                    "vaccines":array[10],
                    "training":array[9],
                    "image":array[4]
                };
                console.log(horse);
                $scope.horse = horse;
                addHorse(horse);
                return i;
                break;
            }
            else if (text[i] == '`') {
                i += 1;
                if (array[10].localeCompare(">") == 0) {
                    array[10] = "";
                }
                if (array[9].localeCompare(">") == 0 ) {
                    array[9] = "";
                }
                if (array[4].localeCompare(">") == 0 ) {
                    array[4] = "";
                }
                var horse = {
                    "name": array[6],
                    "gender": array[3],
                    "breed": array[1],
                    "weight": array[11],
                    "dob": array[2],
                    "sire": array[8],
                    "mare": array[5],
                    "auctionPrice": array[0],
                    "notes": array[7],
                    "vaccines":array[10],
                    "training":array[9],
                    "image":array[4]
                };
                $scope.horse = horse;
                console.log(horse);
                addHorse(horse);
                return i;
                break;
            }
            else if (text[i]== '\r' && array[head].length == 0) {
                head++;
                i+=2;
                continue;
            }
            else if (text[i] == '\r') {
                head++;
                i+=1;
                continue;
            }
            else if (head > 11) {
                i += 1;
                if (array[10].localeCompare(">") == 0) {
                    array[10] = "";
                }
                if (array[9].localeCompare(">") == 0 ) {
                    array[9] = "";
                }
                if (array[4].localeCompare(">") == 0 ) {
                    array[4] = "";
                }
                var horse = {
                    "name": array[6],
                    "gender": array[3],
                    "breed": array[1],
                    "weight": array[11],
                    "dob": array[2],
                    "sire": array[8],
                    "mare": array[5],
                    "auctionPrice": array[0],
                    "notes": array[7],
                    "vaccines":array[10],
                    "training":array[9],
                    "image":array[4]
                };
                $scope.horse = horse;
                addHorse(horse);
                return i;
                break;
            }
            else if (text[i] == '\\') {
                if (text[i+1] == 'n') {
                    array[head]+='\n';
                    i++;
                }
            }
            else {
                array[head]+=text[i];
            }

        }
        
    }
    function processVaccines(ii) {
        var description = "";
        var instructions = "";
        var name = "";
        var price = "";
        var seller = "";
        var head = 0;
        //           0            1             2     3      4       
        var array = [description, instructions, name, price, seller];
        var text = $scope.importData;
        for (var i = ii + 2, len = text.length; i< len; i++) {
            if (text[i] == '~') {
                i += 1;
                var vaccine = {
                    "name": array[2],
                    "description": array[0],
                    "instruction": array[1],
                    "seller": array[4],
                    "price": array[3],
                };
                addVaccine(vaccine);
                return i;
                break;
            }
            else if (text[i] == '`') {
                i += 1;
                var vaccine = {
                    "name": array[2],
                    "description": array[0],
                    "instruction": array[1],
                    "seller": array[4],
                    "price": array[3],
                };
                addVaccine(vaccine);
                return i;
                break;
            }
            else if (text[i] == '\r') {
                head++;
                i+=1;
                //console.log("the character hit is " + text[i]);
                continue;
            }
            else if (head > 5) {
                i += 1;
                var vaccine = {
                    "name": array[2],
                    "description": array[0],
                    "instruction": array[1],
                    "seller": array[4],
                    "price": array[3],
                };
                addVaccine(vaccine);
                return i;
                break;
            }
            else {
                array[head]+=text[i];
            }
        }
    }
    function processTraining(ii) {
        var equipment = "";
        var exercise = "";
        var food = "";
        var location = "";
        var name = "";
        //           0          1         2     3         4
        var array = [equipment, exercise, food, location, name];
        var head = 0;
        var text = $scope.importData;
        for (var i = ii + 2, len = text.length; i< len; i++) {
            if (text[i] == '~') {
                i += 1;
                var regimen = {
                    "name": array[4],
                    "exercise": array[1],
                    "food": array[2],
                    "location": array[3],
                    "equipment": array[0],
                };
                addTraining(regimen);
                return i;
                break;
            }
            else if (text[i] == '`') {
                i += 1;
                var regimen = {
                    "name": array[4],
                    "exercise": array[1],
                    "food": array[2],
                    "location": array[3],
                    "equipment": array[0],
                };
                addTraining(regimen);
                return i;
                break;
            }
            else if (text[i] == '\r') {
                head++;
                i+=1;
                continue;
            }
            else if (head > 5) {
                i += 1;
                var regimen = {
                    "name": array[4],
                    "exercise": array[1],
                    "food": array[2],
                    "location": array[3],
                    "equipment": array[0],
                };
                addTraining(regimen);
                return i;
                break;
            }
            else {
                array[head]+=text[i];
            }
        }
    }
    function getExtension(filename) {
        var parts = filename.split('.');
        return parts[parts.length - 1];
    }
    function addHorse(horse) {
        var url = 'https://blistering-heat-6128.firebaseio.com/Users/' + userName + '/horses';
        var horses = new Firebase(url);
        $scope.horses = $firebaseArray(horses);
        var text = horse.name;
        if (horse.notes.localeCompare(">") == 0) {
            horse.notes = "";
        }
        if (horse.training.localeCompare(">") == 0) {
            hores.training = "";
        }
        if (horse.notes.localeCompare(">") == 0) {
            hores.vaccines = "";
        }
        if (horse.notes.localeCompare(">") == 0) {
            hores.images = "";
        }
        var urlAdd = 'https://blistering-heat-6128.firebaseio.com/Users/' + userName + '/horses/' + horse.name;

        var authenticatedUsersAdd = new Firebase(urlAdd);
        authenticatedUsersAdd.set(horse);
    } 
    function addVaccine(vaccine) {     
        var urlAdd = 'https://blistering-heat-6128.firebaseio.com/Users/' + userName + '/vaccines/' + vaccine.name;
        var vaccinesAdd = new Firebase(urlAdd);
        vaccinesAdd.set(vaccine);
        
    }
    function addTraining(regimen) {
        var urlAdd = 'https://blistering-heat-6128.firebaseio.com/Users/' + userName + '/regimens/' + regimen.name;
        var regimensAdd = new Firebase(urlAdd);
        regimensAdd.set(regimen);
    }
}]);
