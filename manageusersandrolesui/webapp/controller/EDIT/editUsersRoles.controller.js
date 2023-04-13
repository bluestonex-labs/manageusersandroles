sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/viz/ui5/data/FlattenedDataset",
    "sap/ui/core/mvc/XMLView",
    "sap/ui/core/mvc/View",
    "sap/ui/core/library",
    "sap/ui/core/BusyIndicator",
    "sap/m/MessageBox",
    "sap/ui/layout/HorizontalLayout",
    "sap/ui/layout/VerticalLayout",
    "sap/m/library",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Filter",
    "sap/ui/core/Fragment"
    //"cockpit/xsuaa/uaa/UaaUrlUtil"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, FlattenedDataset, XMLView, View, CoreLibrary, BusyIndicator, MessageBox, HorizontalLayout, VerticalLayout, mobileLibrary, FilterOperator, Filter, Fragment) {
        "use strict";


        return Controller.extend("uk.co.brakes.rf.manageusersandrolesui.controller.EDIT.editUsersRoles", {
            onInit: function () {
                var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
                var appPath = appId.replaceAll(".", "/");
                this.appModulePath = jQuery.sap.getModulePath(appPath);

                //Create JSON Model for IDP users
                var oIdpEditUsersModel = sap.ui.getCore().getModel("oIdpEditUserModel")
                this.getView().setModel(oIdpEditUsersModel, "oIdpEditUsersModel");

                //set JSON Model of plants 
                var oBrakesPlantsModel = sap.ui.getCore().getModel("oBrakesPlantsModel");
                this.getView().setModel(oBrakesPlantsModel, "oBrakesPlantsModel");

                //Create JSON Model for max date
                var maxDate = new Date();
                maxDate.setDate(maxDate.getDate() + 45);
                var oDateModel = new sap.ui.model.json.JSONModel({
                    maxDate: maxDate
                });
                this.getView().setModel(oDateModel, "oDateModel");

                //Expiry date field model
                var oExpDateModel = new sap.ui.model.json.JSONModel({
                    enabled: true
                });
                this.getView().setModel(oExpDateModel, "oExpDateModel");

                //Plant field model
                var oPlantModel = new sap.ui.model.json.JSONModel({
                    enabled: true
                });
                this.getView().setModel(oPlantModel, "oPlantModel");

                this.getOwnerComponent().getRouter().getRoute("editUsers").attachPatternMatched(this._onRouteMatched, this);


            },

            onAfterRendering: function () {

            },

            _onRouteMatched: function (oEvent) {
                /*enable expiry date based on if it is maintained */
                if(this.getView().getModel("oIdpEditUsersModel").getData()["urn:ietf:params:scim:schemas:extension:sap:2.0:User"].validTo !== undefined){
                    this.getView().getModel("oExpDateModel").setProperty("/enabled", true);
                }else{
                    this.getView().getModel("oExpDateModel").setProperty("/enabled", false);
                }
                
                /*enable expiry date based on if it is maintained */
                if(this.getView().getModel("oIdpEditUsersModel").getData()["urn:ietf:params:scim:schemas:extension:enterprise:2.0:User"].division !== undefined){
                    this.getView().getModel("oPlantModel").setProperty("/enabled", true);
                }else{
                    this.getView().getModel("oPlantModel").setProperty("/enabled", false);
                }

            },

            /*ui actions */
            onFirstNameChange: function () {
                var sFirstNameVal = this.getView().byId("sFirstNameFld").getValue();
                var sLastNameVal = this.getView().byId("sLastNameFld").getValue();
                if (sFirstNameVal !== "" && sLastNameVal !== "") {
                    this.generateTempUserDetails();
                    //this.getApproverListForLoggedInPlant("GT10");
                    //this.triggerCreateUserinSubAcctWrkFlow("sFirstName", "sLastName", "sUserName", "sEmailId", "bActive", "sValidTo", "sApproverMail", "sApproverId");
                }
            },

            onLastNameChange: function () {
                var sFirstNameVal = this.getView().byId("sFirstNameFld").getValue();
                var sLastNameVal = this.getView().byId("sLastNameFld").getValue();
                if (sFirstNameVal !== "" && sLastNameVal !== "") {
                    this.generateTempUserDetails();
                }
            },

            onSelectUserType: function (oEvent) {
                var sKey = oEvent.getSource().getSelectedKey();
                if (sKey == "Temporary") {
                    BusyIndicator.show(500);
                    this.generateTempUserDetails();
                    /*    var sNewUserNumber = parseInt(this.sLastPUserId.replace(/^\D+/g, '')) + 1;
                        var sNewUserId = "P" + sNewUserNumber;
                        sTempEmail = sNewUserId + sTempEmailDomain;
                        var sTempUserName = "TMP" + sNewUserNumber; */

                } else {
                    this.getView().byId("sEmailFld").setValue("");
                    this.getView().byId("sUserNameFld").setValue("");
                }
            },

            onChangeValidDays: function (oEvent) {
                if (oEvent.getSource().getValue() > 0) {
                    var sFromDate = new Date();
                    var sToDate = new Date();
                    var sValidityDays = parseInt(this.getView().byId("sValidDays").getValue());

                    sToDate.setDate(sFromDate.getDate() + sValidityDays);
                    sToDate = sToDate.toDateString();
                    this.getView().byId("sValidTo").setValue(sToDate);
                } else {
                    this.getView().byId("sValidTo").setValue("");
                }
            },

            /* supporting functions */
            fetchPlants: function () {
                var that = this;
                var sDest = "/brakesgwpp";
                var url = this.appModulePath + sDest + "/sap/opu/odata/sap/ZRF_GOODS_RECEIPT_NB_SRV/PlantsSet";
                BusyIndicator.show(500);
                $.ajax({
                    url: url,
                    type: "GET",
                    contentType: "application/json",
                    dataType: "json",
                    success: function (oData, response) {
                        BusyIndicator.hide();
                        that.getView().getModel("oPlantsModel").setData(oData.d.results);
                        var oPlantsModel = that.getView().getModel("oPlantsModel");
                        that.getView().byId("plantCombobox").setModel(oPlantsModel, "oPlantsModel");
                        if (oData.d.results.length > 0) {
                            that.setDefaultPlant();
                        }
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        BusyIndicator.hide();
                        var err = textStatus;
                        MessageBox.error("An error occurred while fetching the plants data.")
                    }
                }, this);
            },

            setDefaultPlant: function (oEvent) {
                BusyIndicator.show(500);
                this.sUserPlant = "";
                var aPlants = this.getView().byId("plantCombobox").getItems();
                for (var i = 0; i < aPlants.length; i++) {
                    var sPath = aPlants[i].oBindingContexts.oPlantsModel.sPath;
                    if (this.getView().getModel("oPlantsModel").getProperty(sPath).DefaultPlant == 'X') {
                        this.getView().byId("plantCombobox").setSelectedKey(aPlants[i].getProperty("key"));
                        this.sUserPlant = aPlants[i].getProperty("key");
                        break;
                    } else {
                        this.getView().byId("plantCombobox").setSelectedKey(aPlants[0].getProperty("key"));
                        this.sUserPlant = aPlants[0].getProperty("key");
                        break;
                    }
                }
                this.getApproverListForLoggedInPlant(this.sUserPlant);
                BusyIndicator.hide();
            },

            generateTempUserDetails: function () {
                var sIdpLocation = "/cis_brakesdev";
                this.startIndex = "1";
                this.aResources = [];
                var url = this.appModulePath + sIdpLocation + "/scim/Users";
                this.recursiveAjaxToFetchAllIdpUsers(url);
            },

            fetchAllIdpUsers: function () {
                BusyIndicator.show(500);
                var sIdpLocation = "/cis_brakesdev";
                /*switch (this.oLocation) {
                    case "httpsaqcgazolg.accounts.ondemand.com":
                        sIdpLocation = "/cis_bsxtdd";
                        break;
                    case "httpsaqrl92om1.accounts.ondemand.com":
                        sIdpLocation = "/cis_brakesdev";
                        break;
                    default:
                        sIdpLocation = "/cis_bsxtdd";
                } */
                var url = this.appModulePath + sIdpLocation + "/scim/Users";
                var that = this;
                var limit = 25;
                //BusyIndicator.show(500);
                this.startIndex = "1";
                this.sLastPUserId = "";
                this.aResources = [];
                this.recursiveAjaxToFetchAllIdpUsers(url);

                /* $.ajax({
                    url: url,
                    type: "GET",
                    data: {
                        startIndex: '100'
                        //page : '2',
                        //page : 2
                        //'count': limit
                    },
                    //contentType: "application/json",
                    //dataType: "json",
                    //data: JSON.stringify(oPayload),
                    //beforeSend: function (xhr) {
                    //    xhr.setRequestHeader("Accept", "application/json");
                    //},
                    success: function (oData, oResponse) {
                        BusyIndicator.hide();
                        that.getView().getModel("oIdpUsersModel").setData(oData.Resources);
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        BusyIndicator.hide();
                        MessageBox.error("Could not fetch the IDP users " + errorThrown);
                    }
                }, this); */
            },

            recursiveAjaxToFetchAllIdpUsers: function (sUrl) {
                BusyIndicator.show();
                this.sLastPUserId = "";
                this.sNewUserNumber = "";
                this.sNewUserId = "";
                this.sTempEmail = "";
                this.sTempUserName = "";
                this.sTempEmailDomain = "@brakenoemail.co.uk";

                var startIndex = this.startIndex, totalResults, itemsPerPage;
                var that = this;
                var url = sUrl;
                $.ajax({
                    url: url,
                    type: "GET",
                    data: {
                        startIndex: startIndex
                    },
                    success: function (oData, oResponse) {
                        totalResults = oData.totalResults;
                        itemsPerPage = oData.itemsPerPage;
                        if (that.aResources.length <= 0) {
                            that.aResources = oData.Resources;
                        } else {
                            that.aResources = that.aResources.concat(oData.Resources);
                        }

                        /* logic to fetch all the users from the API
                        the API returns a maximum of 100 users per page i.e, per AJAX call
                        hence added the recursive calling of the AJAX call to fetch all the users*/
                        if (that.aResources.length < totalResults) {
                            that.startIndex = that.aResources.length;
                            that.recursiveAjaxToFetchAllIdpUsers(url);
                        } else {
                            var aFinalResources = that.aResources;
                            for (var i = 0; i < aFinalResources.length; i++) {

                                var sUserSchema = "urn:ietf:params:scim:schemas:extension:sap:2.0:User";
                                var sValidTo = aFinalResources[i][sUserSchema].validTo;
                                aFinalResources[i].userFullName = aFinalResources[i].name.givenName + " " + aFinalResources[i].name.familyName;
                                if (sValidTo !== undefined) {
                                    aFinalResources[i].validTo = sValidTo;
                                } else {
                                    aFinalResources[i].validTo = "";
                                }
                            }
                            that.getView().getModel("oIdpUsersModel").setData(aFinalResources);

                            that.sLastPUserId = aFinalResources[aFinalResources.length - 1][sUserSchema].userId;

                            that.sNewUserNumber = parseInt(that.sLastPUserId.replace(/^\D+/g, '')) + 1;
                            that.sNewUserNumber = String(that.sNewUserNumber).padStart(6, "0");

                            that.sNewUserId = "P" + that.sNewUserNumber;
                            that.sTempEmail = that.sNewUserId + that.sTempEmailDomain;
                            that.sTempUserName = "TMP" + that.sNewUserNumber;

                            that.getView().byId("sEmailFld").setValue(that.sTempEmail);
                            that.getView().byId("sUserNameFld").setValue(that.sTempUserName);

                            BusyIndicator.hide();
                        }

                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        BusyIndicator.hide();
                        MessageBox.error("Could not fetch the IDP users " + errorThrown);
                    }
                }, this);
            },

            /*additional functions */
            fetchLoggedInUserDetails: function () {
                //var uaaDetails = UaaUrlUtil;
                var url = this.appModulePath + "/user-api/currentUser";
                var that = this;
                BusyIndicator.show(500);
                $.ajax({
                    url: url,
                    type: "GET",
                    //contentType: "application/json",
                    //dataType: "json",
                    //data: JSON.stringify(oPayload),
                    //beforeSend: function (xhr) {
                    //    xhr.setRequestHeader("Accept", "application/json");
                    //},
                    success: function (oData, oResponse) {
                        BusyIndicator.hide();
                        that.getView().getModel("oUserModel").setData(oData.Resources);
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        BusyIndicator.hide();
                        MessageBox.error("Could not fetch the current user details " + errorThrown);
                    }
                }, this);
            },

            getLoggedInUserDetails: function () {
                BusyIndicator.show();
                var sDest = "/user-api";
                var sUrl = this.appModulePath + sDest + "/currentUser";
                this.loggedinUserEmail = "";
                this.firstname = "";
                this.lastname = "";
                this.name = "";
                this.displayName = "";

                //    var sPlant = this.sUserPlant;
                var that = this;

                $.ajax({
                    url: sUrl,
                    type: "GET",
                    contentType: "application/json",
                    //dataType: "json",
                    //data: JSON.stringify(oPayload),
                    /* beforeSend: function (xhr) {
                        var param = sUrl;
                        var token = that.getCSRFToken(param);
                        xhr.setRequestHeader("X-CSRF-Token", token);
                        xhr.setRequestHeader("Accept", "application/json");
        
                    }, */
                    success: function (oData, response) {
                        var oCurrentUser = JSON.parse(oData);
                        that.loggedinUserEmail = oCurrentUser.email;
                        that.firstname = oCurrentUser.firstname;
                        that.lastname = oCurrentUser.lastname;
                        that.name = oCurrentUser.name;
                        that.displayName = oCurrentUser.displayName;
                        //that.getApproverListForLoggedInPlant(that.sUserPlant);
                        BusyIndicator.hide();

                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        BusyIndicator.hide();
                        MessageBox.error("Password reset email could not be sent");
                    }
                }, that);
            },

            getApproverListForLoggedInPlant: function (sPlant) {
                var that = this;
                var sDest = "/bsxcpeaexperience";
                this.sApproverId = "";
                this.sApproverMail = "";
                var sUrl = this.appModulePath + sDest + "/cpea-experience/Approvers?PLANT=" + sPlant;
                $.ajax({
                    url: sUrl,
                    type: "GET",
                    //contentType: "application/json",
                    data: {
                        $format: 'json'
                    },
                    success: function (oData, response) {
                        that.sApproverId = oData.value[0].APPR_ID;
                        that.sApproverMail = oData.value[0].APPR_EMAIL;
                        BusyIndicator.hide();

                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        BusyIndicator.hide();
                        MessageBox.error("Password reset email could not be sent");
                    }
                }, that);
            },

            onTableUpdateStarted: function (oEvent) {
                var sReason = oEvent.getParameters().reason;
                if (sReason === "Growing") {

                }
            },

            onUserSearch: function (oEvent) {
                this.setFiltersOnUsers();
            },

            setFiltersOnUsers: function (oEvent) {
                var userNameFilter = [], allFilter = [];
                var oUserNameFld = this.getView().byId("userNameInput");
                //    var oLastNameFld = this.getView().byId("lastNameInput");
                var oexpDateFilter = this.getView().byId("expDatePicker");

                if (oUserNameFld.getTokens().length > 0) {
                    for (var i = 0; i < oUserNameFld.getTokens().length; i++) {
                        var sUserName = oUserNameFld.getTokens()[i].getText();
                        userNameFilter.push(new Filter("userFullName", FilterOperator.EQ, sUserName));
                    }
                }

                /*if (oFirstNameFld.getTokens().length > 0) {
                    for (var i = 0; i < oFirstNameFld.getTokens().length; i++) {
                        var sGivenName = oFirstNameFld.getTokens()[i].getKey();
                        givenNameFilter = new Filter("name/givenName", FilterOperator.EQ, sGivenName);
                        userNameFilter.push(givenNameFilter);
                    }
                }
        
                if (oLastNameFld.getTokens().length > 0) {
                    for (var i = 0; i < oLastNameFld.getTokens().length; i++) {
                        var sLastName = oLastNameFld.getTokens()[i].getKey();
                        lastNameFilter = new Filter("name/familyName", FilterOperator.EQ, sLastName);
                        userNameFilter.push(lastNameFilter);
                    }
                } */

                if (userNameFilter.length > 0) {
                    allFilter.push(new Filter(userNameFilter, false));
                    this.getView().byId("usersTable").getBinding("items").filter(allFilter);
                } else {
                    this.getView().byId("usersTable").getBinding("items").filter();
                }

            },

            onSearchUser: function (oEvent) {
                var sValue = oEvent.getSource().getValue();
                if (sValue !== "") {
                    var userFilter = [], allFilter = [];
                    userFilter.push(new Filter("name/givenName", FilterOperator.EQ, sValue));
                    userFilter.push(new Filter("name/familyName", FilterOperator.EQ, sValue));
                    if (userFilter.length > 0) {
                        allFilter.push(new Filter(userFilter, false));
                        this.getView().byId("usersTable").getBinding("items").filter(allFilter);
                    } else {
                        this.getView().byId("usersTable").getBinding("items").filter();
                    }
                } else {
                    this.getView().byId("usersTable").getBinding("items").filter();
                }
            },

            onPressSaveUser: function (oEvent) {
                var sUserId = "";
                var sUserName = "";
                var sUserEmail = "";
                var sPlant = this.getView().byId("plantCombobox").getSelectedKey();
                var sUserStatus = this.getView().byId("userTypeCombobox").getSelectedKey();
                var bUserStatus;
                if(sUserStatus === "active"){
                    bUserStatus = true;
                }else if(sUserStatus === "inactive"){
                    bUserStatus = false;
                }

                var sExpDate = this.getView().byId("expDate").getValue();
                var sValidTo = "";
                if(sExpDate !== ""){
                    sValidTo = new Date(sExpDate).toISOString();
                }

                //    var sRowPath = this.getView().getModel("oIdpEditUserModel").getPath();
                sUserId = this.getView().getModel("oIdpEditUsersModel").getData().id;
                sUserId = sUserId.toUpperCase();
                sUserName = this.getView().getModel("oIdpEditUsersModel").getData().userName;
                sUserEmail = this.getView().getModel("oIdpEditUsersModel").getData().emails[0].value;

                var oLocation = "/cis_brakesdev";
                var that = this;
                var url = this.appModulePath + oLocation + "/scim/Users/" + sUserId;

                //var sNewExpDate = 
                BusyIndicator.show(500);

                var oPayload = {
                    "schemas": [
                        "urn:ietf:params:scim:api:messages:2.0:PatchOp"
                    ],
                    "Operations": []
                };

                if(bUserStatus !== ""){
                    var oUserStatus = {
                        "op": "replace",
                        "value": {
                            "active": bUserStatus
                        }
                    }

                    oPayload.Operations.push(oUserStatus);
                }

                if(sPlant !== ""){
                    var oPlant = {
                        "op": "replace",
                        "path": "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User:division",
                        "value": sPlant
                    }

                    oPayload.Operations.push(oPlant);
                }

                if(sValidTo !== ""){
                    var oExpDate = {
                        "op": "replace",
                        "path": "urn:ietf:params:scim:schemas:extension:sap:2.0:User:validTo",
                        "value": sValidTo
                    }

                    oPayload.Operations.push(oExpDate);
                }

                /* var oPayload = {
                    "schemas": [
                        "urn:ietf:params:scim:api:messages:2.0:PatchOp"
                    ],
                    "Operations": [
                        {
                            "op": "replace",
                            "value": {
                                "active": bUserStatus
                            }
                        },
                        {
                            "op": "replace",
                            "path": "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User:division",
                            "value": sPlant
                        }
                        {
                            "op": "replace",
                            "path": "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User:validTo",
                            "value": sValidTo
                        } 
                    ]
                }; */

                $.ajax({
                    url: url,
                    type: "PATCH",
                    contentType: "application/scim+json",
                    dataType: "json",
                    data: JSON.stringify(oPayload),
                    beforeSend: function (xhr) {
                        var param = url;
                        var token = that.getCSRFToken(param);
                        xhr.setRequestHeader("X-CSRF-Token", token);
                        xhr.setRequestHeader("Accept", "application/scim+json");
                        //    xhr.setRequestHeader("Authorization", "Bearer eyJhbGciOiJSUzI1NiIsImprdSI6Imh0dHBzOi8vYnN4LXRkZC1xcThha3pqbi5hdXRoZW50aWNhdGlvbi5ldTEwLmhhbmEub25kZW1hbmQuY29tL3Rva2VuX2tleXMiLCJraWQiOiJkZWZhdWx0LWp3dC1rZXktLTEyMTM1MTE0MDQiLCJ0eXAiOiJKV1QiLCJqaWQiOiAicnhZTkNZRm1hQWF4QlM0WjZKUDRabGhnc2xHUjRRUXdGT2EwLzZwVXMrOD0ifQ.eyJqdGkiOiJhODhlYjI2ZTliZDE0MDdhYTc4MTUyYWY2ZTI5NjhhZiIsImV4dF9hdHRyIjp7ImVuaGFuY2VyIjoiWFNVQUEiLCJzdWJhY2NvdW50aWQiOiI3YmMyZTRhMi1iMWZiLTQyMGUtOGZmMy0wYzE5MzhkNDE5YWIiLCJ6ZG4iOiJic3gtdGRkLXFxOGFrempuIn0sInN1YiI6InNiLW5hLWZkNjlkNzM5LWRkN2MtNDk5Ni05NzM5LTFhZjU5NGUwOGQwYiFhMTI0OTY5IiwiYXV0aG9yaXRpZXMiOlsieHNfdXNlci53cml0ZSIsInVhYS5yZXNvdXJjZSIsInhzX2F1dGhvcml6YXRpb24ucmVhZCIsInhzX2lkcC53cml0ZSIsInhzX3VzZXIucmVhZCIsInhzX2lkcC5yZWFkIiwieHNfYXV0aG9yaXphdGlvbi53cml0ZSJdLCJzY29wZSI6WyJ4c191c2VyLndyaXRlIiwidWFhLnJlc291cmNlIiwieHNfYXV0aG9yaXphdGlvbi5yZWFkIiwieHNfaWRwLndyaXRlIiwieHNfdXNlci5yZWFkIiwieHNfaWRwLnJlYWQiLCJ4c19hdXRob3JpemF0aW9uLndyaXRlIl0sImNsaWVudF9pZCI6InNiLW5hLWZkNjlkNzM5LWRkN2MtNDk5Ni05NzM5LTFhZjU5NGUwOGQwYiFhMTI0OTY5IiwiY2lkIjoic2ItbmEtZmQ2OWQ3MzktZGQ3Yy00OTk2LTk3MzktMWFmNTk0ZTA4ZDBiIWExMjQ5NjkiLCJhenAiOiJzYi1uYS1mZDY5ZDczOS1kZDdjLTQ5OTYtOTczOS0xYWY1OTRlMDhkMGIhYTEyNDk2OSIsImdyYW50X3R5cGUiOiJjbGllbnRfY3JlZGVudGlhbHMiLCJyZXZfc2lnIjoiOTM5YTExMWEiLCJpYXQiOjE2NzY0OTg4MzUsImV4cCI6MTY3NjU0MjAzNSwiaXNzIjoiaHR0cHM6Ly9ic3gtdGRkLXFxOGFrempuLmF1dGhlbnRpY2F0aW9uLmV1MTAuaGFuYS5vbmRlbWFuZC5jb20vb2F1dGgvdG9rZW4iLCJ6aWQiOiI3YmMyZTRhMi1iMWZiLTQyMGUtOGZmMy0wYzE5MzhkNDE5YWIiLCJhdWQiOlsic2ItbmEtZmQ2OWQ3MzktZGQ3Yy00OTk2LTk3MzktMWFmNTk0ZTA4ZDBiIWExMjQ5NjkiLCJ1YWEiLCJ4c191c2VyIiwieHNfaWRwIiwieHNfYXV0aG9yaXphdGlvbiJdfQ.WnnxstYfIPsQLDhJN-_yCgqwyzVppcwiXjLGifeRPfVyHq0GTPhj2PjOaS45fq3uj2gOC5UAfGxwr9xpyUiSk9iVJ8KdDy7yX5kwSAB_sqh2aDDyJb8qccQwiZHAuVZrDBmnGJXGSfNu5IAvwqr3SiXI2MfBI4Ti7SfeDFkxIbtk0N8twySjUWOlDA0_1nNR-IfGqqdxMNVCEeV8ANunQO8W_-2OmajeBqp4KMBdKu18H_4nXM7lQR-SaNgF0GT7rQA7Vfzbo5Yq_x4EIAKgOfosaAiF4uzLx4vMxetU38IMQiGkRHRYceBo01R2BwSyvHWIMgeEFo2NqWLJvSTZ_w");

                    },
                    success: function (oData, response) {
                        BusyIndicator.hide();
                        var sText = "The user has been successfully updated";
                        MessageBox.success(sText, {
                            onClose: function (sAction) {
                                if (sAction === "OK") {
                                    //    that.fetchAllIdpUsers();
                                }
                            }
                        });
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        BusyIndicator.hide();
                        MessageBox.error("The user could not be updated successfully", errorThrown);
                    }
                }, this);

            },

            getCSRFToken: function (url) {
                var token = null;
                $.ajax({
                    url: url,
                    type: "GET",
                    async: false,
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader("X-CSRF-Token", "Fetch");
                    },
                    complete: function (xhr) {
                        token = xhr.getResponseHeader("X-CSRF-Token");
                    }
                });
                return token;
            },

            /*on cancel create user */
            onCancelSaveUser: function (oEvent) {
                this.getOwnerComponent().getRouter().navTo("RouteView1");
            },

            /*formatters */
            identifyMailId: function (aMailIds) {
                for (var i = 0; i < aMailIds.length; i++) {
                    if (aMailIds[i].primary === true) {
                        return aMailIds[i].value;
                    }
                }
            },

            formatValidTo: function (sDate) {
                if (sDate !== undefined && sDate !== null && sDate !== "") {
                    var sDate = new Date(sDate);
                    var sNewDate = sDate.toDateString();
                    return sNewDate;
                } else {
                    return "";
                }

            },

            formatUserStatus: function (bActive) {
                if (bActive === true) {
                    return "active";
                } else if (bActive === false) {
                    return "inactive";
                }
            }
        });
    });