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


        return Controller.extend("uk.co.brakes.rf.manageusersandrolesui.controller.MANAGE.manageUsersRoles", {
            onInit: function () {
                var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
                var appPath = appId.replaceAll(".", "/");
                this.appModulePath = jQuery.sap.getModulePath(appPath);

                this.getOwnerComponent().getRouter().getRoute("manageUsers").attachPatternMatched(this._onManageRouteMatched, this);

                //Create JSON Model for IDP users
                var oIdpUsersModel = new sap.ui.model.json.JSONModel();
                this.getView().setModel(oIdpUsersModel, "oIdpUsersModel");

                // create json model to get the logged in user
                //var oUserModel = new JSONModel("/services/userapi/currentUser");
                var oUserModel = new sap.ui.model.json.JSONModel();
                this.getView().setModel(oUserModel, "oUserModel");

                var oUsrMdl = this.getOwnerComponent().getModel("userModel");
                var oUsrMdlData = oUsrMdl.getData();

                if (oUsrMdlData.decodedJWTToken) {
                    this.oLocation = oUsrMdlData.decodedJWTToken.origin;
                } else {
                    this.oLocation = "";
                }

                //Create JSON Model for available plants
                var oPlantsModel = new sap.ui.model.json.JSONModel();
                this.getView().setModel(oPlantsModel, "oPlantsModel");

                //Create JSON Model for max date
                var maxDate = new Date();
                maxDate.setDate(maxDate.getDate() + 45);
                var oDateModel = new sap.ui.model.json.JSONModel({
                    maxDate: maxDate
                });
                this.getView().setModel(oDateModel, "oDateModel");

                this.fetchPlants();
                //this.fetchAllIdpUsers();

            },

            onAfterRendering: function () {

            },

            _onManageRouteMatched: function (oEvent) {
                this.getLoggedInUserDetails();
                this.generateTempUserDetails();
                this.clearInputFields();
            },


            clearInputFields: function () {
                this.getView().byId("sFirstNameFld").setValue("");
                this.getView().byId("sLastNameFld").setValue("");
                this.getView().byId("plantCombobox").setSelectedKey("");
                this.getView().byId("expDate").setValue("");
                this.getView().byId("sUserPasswordFld").setValue("");

                //this.getView().byId("createUserBtn").setEnabled(false);
                //    this.getView().byId("sEmailFld").setValue("");
                //    this.getView().byId("sUserNameFld").setValue("");
            },

            clearPopoverFlds: function (oEvent) {
                oEvent.getSource().destroy();
                this.oPasswordPopover = null;
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

            /* functions for create user - BEGIN*/
            onListSelect: function (oEvent) {


                var btpList = this.getView().byId("btpList");
                //    var gwList = this.getView().byId("gwList");
                //    var erpList = this.getView().byId("erpList");

                var btpSwitch = this.getView().byId("btpSwitch");
                //    var gwSwitch = this.getView().byId("gwSwitch");
                //    var erpSwitch = this.getView().byId("erpSwitch");

                var title = this.getView().byId("rolesTitle");

                var accessSection = this.getView().byId("accessSection");

                if (oEvent.getSource().getId().includes("btp")) {
                    accessSection.setVisible(true);
                    btpSwitch.setState(true);
                    //    gwList.removeSelections();
                    //    erpList.removeSelections();
                    title.setText("BTP Access");
                }

                /* if (oEvent.getSource().getId().includes("gw")) {
                    accessSection.setVisible(true);
                    gwSwitch.setState(true);
                    btpList.removeSelections();
                    erpList.removeSelections();
                    title.setText("Gateway Access");
                }

                if (oEvent.getSource().getId().includes("erp")) {
                    accessSection.setVisible(true);
                    erpSwitch.setState(true);
                    gwList.removeSelections();
                    btpList.removeSelections();
                    title.setText("ERP Access");
                } */

            },

            onPasswordLiveChange: function (oEvent) {
                var oPasswdFld = oEvent.getSource(),
                    oView = this.getView(),
                    that = this;
                var sPassword = oPasswdFld.getValue();
                this.bValidPassword = false;

                if (sPassword !== "") {

                    // create popover
                    if (!this.oPasswordPopover) {
                        this.oPasswordPopover = Fragment.load({
                            id: oView.getId(),
                            name: "uk.co.brakes.rf.manageusersandrolesui.fragments.PasswordHelpPopover",
                            controller: this
                        }).then(function (oPopover) {
                            oView.addDependent(oPopover);
                            return oPopover;
                        });
                    }
                    this.oPasswordPopover.then(function (oPopover) {
                        oPopover.openBy(oPasswdFld);
                        oPopover.setInitialFocus(oPasswdFld);
                        /*check for following password criteria for creation */
                        /*1. must contain  at least 8 characters long
                          2. must include Uppercase letters
                          3. must inclue Lowercase Letters
                          4. must include Numbers
                          5. must include Symbols*/

                        //Char Length >= 8
                        if (sPassword.length >= 8) {
                            oView.byId("pswdCharLen_cBox").setSelected(true);
                        } else {
                            oView.byId("pswdCharLen_cBox").setSelected(false);
                        }

                        //uppercase letters
                        if (Boolean(sPassword.match(/[A-Z]/))) {
                            oView.byId("pswdUpperCase_cBox").setSelected(true);
                        } else {
                            oView.byId("pswdUpperCase_cBox").setSelected(false);
                        }

                        //lowercase letters
                        if (Boolean(sPassword.match(/[a-z]/))) {
                            oView.byId("pswdLowerCase_cBox").setSelected(true);
                        } else {
                            oView.byId("pswdLowerCase_cBox").setSelected(false);
                        }

                        //numbers
                        if (Boolean(sPassword.match(/\d/))) {
                            oView.byId("pswdNumber_cBox").setSelected(true);
                        } else {
                            oView.byId("pswdNumber_cBox").setSelected(false);
                        }

                        //symbols
                        if (Boolean(sPassword.match(/[`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/))) {
                            oView.byId("pswdSymbol_cBox").setSelected(true);
                        } else {
                            oView.byId("pswdSymbol_cBox").setSelected(false);
                        }

                        if (oView.byId("pswdCharLen_cBox").getSelected() &&
                            oView.byId("pswdUpperCase_cBox").getSelected() &&
                            oView.byId("pswdLowerCase_cBox").getSelected() &&
                            oView.byId("pswdNumber_cBox").getSelected() &&
                            oView.byId("pswdSymbol_cBox").getSelected()) {
                            that.bValidPassword = true;
                        } else {
                            that.bValidPassword = false;
                        }
                    });

                }
            },

            onPasswordChange: function (oEvent) {
                var sPassword = this.getView().byId("sUserPasswordFld").getValue();
                if (sPassword !== "") {
                    if (this.bValidPassword &&
                        this.getView().byId("sFirstNameFld").getValue() !== "" &&
                        this.getView().byId("sLastNameFld").getValue() !== "" &&
                        this.getView().byId("plantCombobox").getSelectedKey() !== "" &&
                        this.getView().byId("expDate").getValue() !== "" &&
                        this.getView().byId("sEmailFld").getValue() !== "" &&
                        this.getView().byId("sUserNameFld").getValue() !== "") {
                        this.getView().byId("createUserBtn").setEnabled(true);
                    } else {
                        this.getView().byId("createUserBtn").setEnabled(false);
                    }
                }

            },

            onPressCreateUser: function (oEvent) {
                /*Temporary = External | Permanent = Employee */
                var sUserType = "External";
                var bActive = false;
                //var expDate = this.getView().byId("expDate").getValue();
                //var sValidTo = new Date(expDate).toISOString();
                //var sPlant = this.sUserPlant;


                var sFirstNameFld = this.getView().byId("sFirstNameFld");
                var sFirstName = this.getView().byId("sFirstNameFld").getValue();

                var sLastNameFld = this.getView().byId("sLastNameFld");
                var sLastName = this.getView().byId("sLastNameFld").getValue();

                var sUserNameFld = this.getView().byId("sUserNameFld");
                var sUserName = this.getView().byId("sUserNameFld").getValue();

                var sEmailIdFld = this.getView().byId("sEmailFld");
                var sEmailId = this.getView().byId("sEmailFld").getValue();

                var sInitialPasswordFld = this.getView().byId("sUserPasswordFld");
                var sInitialPassword = this.getView().byId("sUserPasswordFld").getValue();

                var sPlantFld = this.getView().byId("plantCombobox");
                var sPlant = this.sUserPlant;

                var sExpiryDateFld = this.getView().byId("expDate");
                var sExpiryDate = this.getView().byId("expDate").getValue();
                var sValidTo = "";

                if (sFirstName === "") {
                    MessageBox.error("Please fill in the 'First Name' to proceed with the user creation", {
                        onClose: function (sAction) {
                            if (sAction === "CLOSE") {
                                jQuery.sap.delayedCall(300, this, function () {
                                    sFirstNameFld.focus();
                                });
                            }
                        }
                    });
                } else if (sLastName === "") {
                    MessageBox.error("Please fill in the 'Last Name' to proceed with the user creation", {
                        onClose: function (sAction) {
                            if (sAction === "CLOSE") {
                                jQuery.sap.delayedCall(300, this, function () {
                                    sLastNameFld.focus();
                                });
                            }
                        }
                    });
                } else if (sPlant === "") {
                    MessageBox.error("Please fill in the 'Plant' to proceed with the user creation", {
                        onClose: function (sAction) {
                            if (sAction === "CLOSE") {
                                jQuery.sap.delayedCall(300, this, function () {
                                    sPlantFld.focus();
                                });
                            }
                        }
                    });
                } else if (sEmailId === "") {
                    MessageBox.error("Please fill in the 'Email Id' to proceed with the user creation", {
                        onClose: function (sAction) {
                            if (sAction === "CLOSE") {
                                jQuery.sap.delayedCall(300, this, function () {
                                    sEmailId.focus();
                                });
                            }
                        }
                    });
                } else if (sUserName === "") {
                    MessageBox.error("Please fill in the 'User Name' to proceed with the user creation", {
                        onClose: function (sAction) {
                            if (sAction === "CLOSE") {
                                jQuery.sap.delayedCall(300, this, function () {
                                    sUserNameFld.focus();
                                });
                            }
                        }
                    });
                } else if (sExpiryDate === "") {
                    MessageBox.error("Please fill in the 'Expiry Date' to proceed with the user creation", {
                        onClose: function (sAction) {
                            if (sAction === "CLOSE") {
                                jQuery.sap.delayedCall(300, this, function () {
                                    sExpiryDateFld.focus();
                                });
                            }
                        }
                    });
                } else if (sInitialPassword === "") {
                    MessageBox.error("Please fill in the 'Initial Password' to proceed with the user creation", {
                        onClose: function (sAction) {
                            if (sAction === "CLOSE") {
                                jQuery.sap.delayedCall(300, this, function () {
                                    sInitialPasswordFld.focus();
                                });
                            }
                        }
                    });
                } else {
                    sValidTo = new Date(sExpiryDate).toISOString();
                    this.createUserInIdp(sFirstName, sLastName, sUserName, sEmailId, sInitialPassword, sUserType, bActive, sValidTo, sPlant);
                }


                /* if (sFirstName == "" || sLastName == "" || sUserName == "" || sEmailId == "") {
                    MessageBox.error("Cannot proceed with the creation of user until all the mandatory fields are filled");
                } else {
                    this.createUserInIdp(sFirstName, sLastName, sUserName, sEmailId, sInitialPassword, sUserType, bActive, sValidTo, sPlant);
                } */
            },

            createUserInIdp: function (sFirstName, sLastName, sUserName, sEmailId, sInitialPassword, sUserType, bActive, sValidTo, sPlant) {
                var that = this;

                /* var oPayload = {
                    "emails": [
                        {
                            "primary": true,
                            "value": sEmailId
                        }
                    ],
                    "name": {
                        "familyName": sLastName,
                        "givenName": sFirstName
                    },
                    "schemas": [
                        "urn:ietf:params:scim:schemas:core:2.0:User"
                    ],
                    "userName": sUserName
                }; 

                var oPayload = {
                    "userName": sUserName,
                    "password": "initial1!",
                    "active": false,
                    "mailVerified": "TRUE",
                    "userType": "External",
                    "emails": [
                        {
                            "primary": true,
                            "value": sEmailId
                        }
                    ],
                    "name": {
                        "familyName": sLastName,
                        "givenName": sFirstName
                    },
                    "schemas": [
                        "urn:ietf:params:scim:schemas:core:2.0:User"
                    ]
                }; */

                var oNewPayload =
                {
                    "schemas": [
                        "urn:ietf:params:scim:schemas:core:2.0:User",
                        "urn:ietf:params:scim:schemas:extension:sap:2.0:User",
                        "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User" // for setting Plant in Division
                    ],
                    "userName": sUserName,
                    "password": sInitialPassword,
                    "name": {
                        "familyName": sLastName,
                        "givenName": sFirstName
                    },
                    "userType": sUserType,
                    "active": bActive,
                    "emails": [
                        {
                            "value": sEmailId,
                            "primary": true
                        }
                    ],
                    "urn:ietf:params:scim:schemas:extension:sap:2.0:User": {
                        "mailVerified": true,
                        // "validFrom": "2023-02-23T14:37:04.991Z",
                        "validTo": sValidTo
                    },
                    "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User": {
                        "division": sPlant
                    }
                };

                /* var oNewPayload=     {
                    "schemas": [
                       "urn:ietf:params:scim:schemas:core:2.0:User",
                       "urn:ietf:params:scim:schemas:extension:sap:2.0:User"
                    ],
                    "userName": "user17",
                    "password": "initial1!",
                    "name": {
                       "familyName": "example17",
                       "givenName": "user17"
                    },
                    "userType": "External",
                    "active": false,
                    "emails": [
                       {
                          "value": "user17.example1@example.com",
                          "primary": true
                       }
                    ],
                    "urn:ietf:params:scim:schemas:extension:sap:2.0:User": {
                         "mailVerified": true,
                         "validFrom": "2023-02-23T14:37:04.991Z",
                         "validTo": "2024-02-23T14:37:04.991Z"
                     }
                 }; */
                var oLocation = "/cis_brakesdev";
                /* switch (this.oLocation) {
                    case "httpsaqcgazolg.accounts.ondemand.com":
                        oLocation = "/cis_bsxtdd";
                        break;
                    case "httpsaqrl92om1.accounts.ondemand.com":
                        oLocation = "/cis_brakesdev";
                        break;
                    default:
                        oLocation = "/cis_bsxtdd";
                } */
                var url = this.appModulePath + oLocation + "/scim/Users";

                BusyIndicator.show(500);
                $.ajax({
                    url: url,
                    type: "POST",
                    contentType: "application/scim+json",
                    dataType: "json",
                    data: JSON.stringify(oNewPayload),
                    beforeSend: function (xhr) {
                        var param = url;
                        var token = that.getCSRFToken(param);
                        xhr.setRequestHeader("X-CSRF-Token", token);
                        xhr.setRequestHeader("Accept", "application/scim+json");

                    },
                    success: function (oData, response) {
                        BusyIndicator.hide();
                        var sIdpId = oData.id;
                        MessageBox.success("User has been created successfully in the IDP, proceeding with user creation in subaccount", {
                            onClose: function (sAction) {
                                if (sAction === "OK") {
                                    //that.createUserInSubaccount(sFirstName, sLastName, sUserName, sEmailId);
                                    that.triggerCreateUserinSubAcctWrkFlow(sIdpId, sFirstName, sLastName, sUserName, sEmailId, bActive, sValidTo, this.sApproverMail, this.sApproverId);
                                }
                            }
                        });
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        BusyIndicator.hide();
                        MessageBox.error("User could not be created in IDP, please re-try", errorThrown);
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

            triggerCreateUserinSubAcctWrkFlow: function (sIdpId, sFirstName, sLastName, sUserName, sEmailId, bActive, sValidTo, sApproverMail, sApproverId) {
                var that = this;
                var sCsrfToken = this.appModulePath + "/sap_process_automation_api";
                var sDest = "/sap_process_automation_api/";
                var sWorkFlowUrl = this.appModulePath + sDest;

                var oneDay = 24 * 60 * 60 * 1000;
                var expDay = this.getView().byId("expDate").getValue();
                var sUserValidFor = Math.round(Math.abs((new Date() - new Date(expDay)) / oneDay));

                var sUserRole = "RF Role";
                var sUserType = "External";
                /* if (bActive) {
                    sUserType = "Active"
                } */

                var createUserPayload =
                {
                    "createnewuserpayload": {
                        "LoggedInUserEmail": this.loggedinUserEmail,
                        "UserName": sUserName,
                        "payload": {
                            "userName": sUserName,
                            "name": {
                                "familyName": sLastName,
                                "givenName": sFirstName
                            },
                            "emails": [
                                {
                                    "type": "string",
                                    "value": sEmailId,
                                    "primary": true
                                }
                            ],
                            "active": true,
                            "verified": true,
                            "origin": "sap.default",
                            "schemas": [
                                "urn:scim:schemas:core:1.0"
                            ],
                            "userType": "External"
                        },
                        "ApproverMail": this.sApproverMail,
                        "UserValidFor": sUserValidFor,
                        "UserRole": sUserRole,
                        "UserMailId": sEmailId,
                        //"ApproverId": this.sApproverId,
                        "ApproverId": "CHANDRASEKAR",
                        "UserLastName": sLastName,
                        "UserFirstName": sFirstName,
                        "UserExpiryDate": sValidTo,
                        "UserType": sUserType
                    }
                };

                var oCreateUserPayload = {
                    "createnewuserpayload": {
                        "IdpId": sIdpId,
                        "ApproverId": "CHANDRASEKAR",
                        "UserName": sUserName,
                        //"ApproverMail": this.sApproverMail,
                        "ApproverMail": "",
                        "UserValidFor": sUserValidFor.toString(),
                        "UserRole": sUserRole,
                        "UserMailId": sEmailId,
                        "UserLastName": sLastName,
                        "UserFirstName": sFirstName,
                        "UserExpiryDate": sValidTo,
                        "UserType": sUserType,
                        "payload": {
                            "userName": sUserName,
                            "name": {
                                "familyName": sLastName,
                                "givenName": sFirstName
                            },
                            "emails": [
                                {
                                    "type": "string",
                                    "value": sEmailId,
                                    "primary": true
                                }
                            ],
                            "active": true,
                            "verified": true,
                            "origin": "sap.default",
                            "schemas": [
                                "urn:scim:schemas:core:1.0"
                            ],
                            "userType": "External"
                        },
                        "LoggedInUserEmail": this.loggedinUserEmail,
                        "AssignRole": {
                            "rolePayload": {
                                "id": "RF_Processing_Role"
                            }
                        },
                        "ActivateIdp": {
                            "activateIdpPayload": {

                            }
                        }
                    }
                };

                var workflowStartPayload = {
                    //    definitionId: "bsx.createuserworkflowbtp",
                    "definitionId": "eu10.brakes-dev-btww4abu.createnewuser.createNewUser",
                    context: oCreateUserPayload
                };

                BusyIndicator.show(500);
                $.ajax({
                    url: sWorkFlowUrl,
                    type: "POST",
                    contentType: "application/json",
                    //dataType: "json",
                    data: JSON.stringify(workflowStartPayload),
                    beforeSend: function (xhr) {
                        //var param = sWorkFlowUrl;
                        //var token = that.getCSRFToken(sCsrfToken);
                        //xhr.setRequestHeader("X-CSRF-Token", token);
                        xhr.setRequestHeader("Accept", "application/json");
                        //xhr.setRequestHeader("Authorization", "Bearer eyJhbGciOiJSUzI1NiIsImprdSI6Imh0dHBzOi8vYnJha2VzLWRldi1idHd3NGFidS5hdXRoZW50aWNhdGlvbi5ldTEwLmhhbmEub25kZW1hbmQuY29tL3Rva2VuX2tleXMiLCJraWQiOiJkZWZhdWx0LWp3dC1rZXktLTEwNzg4Mjg1MTQiLCJ0eXAiOiJKV1QiLCJqaWQiOiAiT24rMGRGTTM1WlV0Ylk3ZXNqVTBkcjZXMmZvS3lGL3lQMHRVZ2ZETHVuMD0ifQ.eyJqdGkiOiJhOGUzMWM0YmZkMjM0ODNmODc1ZTYzMzU4NTAwNjJhNyIsImV4dF9hdHRyIjp7ImVuaGFuY2VyIjoiWFNVQUEiLCJzdWJhY2NvdW50aWQiOiJkZGMyZDg4Yi05ZTBjLTQ1OWEtYTUyMy0wOTcyOWRiOThiMTMiLCJ6ZG4iOiJicmFrZXMtZGV2LWJ0d3c0YWJ1Iiwic2VydmljZWluc3RhbmNlaWQiOiJmN2VmNjJmYi0yMjNiLTQ5YTItOGU4OC1kY2YyMzk5MjNjYzkifSwic3ViIjoic2ItZjdlZjYyZmItMjIzYi00OWEyLThlODgtZGNmMjM5OTIzY2M5IWIxNDQ2NTB8eHN1YWEhYjEyMDI0OSIsImF1dGhvcml0aWVzIjpbInVhYS5yZXNvdXJjZSJdLCJzY29wZSI6WyJ1YWEucmVzb3VyY2UiXSwiY2xpZW50X2lkIjoic2ItZjdlZjYyZmItMjIzYi00OWEyLThlODgtZGNmMjM5OTIzY2M5IWIxNDQ2NTB8eHN1YWEhYjEyMDI0OSIsImNpZCI6InNiLWY3ZWY2MmZiLTIyM2ItNDlhMi04ZTg4LWRjZjIzOTkyM2NjOSFiMTQ0NjUwfHhzdWFhIWIxMjAyNDkiLCJhenAiOiJzYi1mN2VmNjJmYi0yMjNiLTQ5YTItOGU4OC1kY2YyMzk5MjNjYzkhYjE0NDY1MHx4c3VhYSFiMTIwMjQ5IiwiZ3JhbnRfdHlwZSI6ImNsaWVudF9jcmVkZW50aWFscyIsInJldl9zaWciOiJkMTY5YjdlZSIsImlhdCI6MTY3OTk1OTE0NSwiZXhwIjoxNjgwMDAyMzQ1LCJpc3MiOiJodHRwczovL2JyYWtlcy1kZXYtYnR3dzRhYnUuYXV0aGVudGljYXRpb24uZXUxMC5oYW5hLm9uZGVtYW5kLmNvbS9vYXV0aC90b2tlbiIsInppZCI6ImRkYzJkODhiLTllMGMtNDU5YS1hNTIzLTA5NzI5ZGI5OGIxMyIsImF1ZCI6WyJ1YWEiLCJzYi1mN2VmNjJmYi0yMjNiLTQ5YTItOGU4OC1kY2YyMzk5MjNjYzkhYjE0NDY1MHx4c3VhYSFiMTIwMjQ5Il19.WYVc664p10BdVUeE3Bvd1YLBN7EAtpNYplxs2zmebH4t9TFzeKGbuo6LI7n5rOPRoTyNjY36mTBnWQgHHHvCf4ENLDjJCqC7j0oifA0DW3bpljj2HS8bcw0QB7DupdP0T36Aw1aS1DSEZzYJ_YQ4A38Qkc6kTkeSduPA8hCgVDP09S6pSXgA1OVDhWUQqPH1cVEW3t-kJlQY4TVWnUuaGLpL5C5gxSz5bm_YmucQe8Tf54dhB5zOrgF5LyfEVLrjwgFK3jMXXsAU9Rqod_CLtSzTqUkL8XXoFradynFKaIAuactHEB6qF7uJQfbUexYFDixWg2E7B5XKsbni1DaNgg");
                    },
                    success: function (oData, response) {
                        BusyIndicator.hide();
                        MessageBox.success("Approval workflow for creating user has been triggered successfully", {
                            onClose: function (sAction) {
                                that.getOwnerComponent().getRouter().navTo("RouteView1");
                            }
                        });
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        BusyIndicator.hide();
                        MessageBox.error("Could not trigger the approval workflow for creating user, please re-try", errorThrown, {
                            onClose: function (sAction) {
                                that.getOwnerComponent().getRouter().navTo("RouteView1");
                            }
                        });
                    }
                }, this);
            },

            createUserInSubaccount: function (sFirstName, sLastName, sUserName, sEmailId) {
                var that = this;

                var path = "https://cockpit.eu10.hana.ondemand.com/" + "ajax/";
                var globalAccountGuid = "8dbdeef9-0011-4c0d-86f6-1263455768f9" + "/";
                var sRegion = "cf-eu10" + "/";
                var subAccountId = this.subAccId;
                //    var subAccountId = "7bc2e4a2-b1fb-420e-8ff3-0c1938d419ab";
                var sEntity = "/" + "createShadowUser" + "/";
                //var oLocation = "/btp_cockpit";

                //var url = this.appModulePath + oLocation + "/ajax/" + globalAccountGuid + sRegion + subAccountId + sEntity + subAccountId;

                //var url1 = "https://api.authentication.eu10.hana.ondemand.com" + "/Users";

                var sDest = "/scim_shadow_users";
                var url = this.appModulePath + sDest + "/Users";
                //var url = this.appModulePath + sDest;
                //var url = "https://api.authentication.eu10.hana.ondemand.com/Users";
                var oPayload = {
                    "origin": this.oLocation,
                    "username": sUserName,
                    "email": sEmailId
                };

                var oPayload1 = {
                    "id": "ef4772b9-3295-4d12-af66-ef07fce21227",
                    "externalId": "",
                    "meta": {
                        "attributes": [
                            "string"
                        ],
                        "version": 1,
                        "created": "2023-02-15T12:56:14.642Z",
                        "lastModified": "2023-02-15T12:56:14.642Z"
                    },
                    "userName": sUserName,
                    "name": {
                        "familyName": sLastName,
                        "givenName": sFirstName,
                        "honorificPrefix": "string",
                        "honorificSuffix": "string",
                        "formatted": "string",
                        "middleName": "string"
                    },
                    "emails": [
                        {
                            "type": "string",
                            "value": sEmailId,
                            "primary": true
                        }
                    ],
                    "approvals": [
                        {
                            "clientId": "cloud_controller",
                            "expiresAt": "2023-02-15T12:56:14.642Z",
                            "lastUpdatedAt": "2023-02-15T12:56:14.642Z",
                            "scope": "cloud_controller.write",
                            "status": "APPROVED",
                            "userId": ""
                        }
                    ],
                    "active": true,
                    "verified": true,
                    "origin": "sap.default",
                    "zoneId": subAccountId,
                    "displayName": "string",
                    "locale": "string",
                    "nickName": "string",
                    "passwordLastModified": "2023-02-15T12:56:14.642Z",
                    "previousLogonTime": 1588056537011,
                    "lastLogonTime": 1589284136890,
                    "schemas": [
                        "urn:scim:schemas:core:1.0"
                    ],
                    "phoneNumbers": [
                        {
                            "value": "123456789"
                        }
                    ],
                    "preferredLanguage": "string",
                    "profileUrl": "string",
                    "salt": "string",
                    "timezone": "string",
                    "title": "string",
                    "userType": "string"
                };

                BusyIndicator.show(500);
                $.ajax({
                    url: url,
                    type: "POST",
                    contentType: "application/json",
                    dataType: "json",
                    data: JSON.stringify(oPayload1),
                    beforeSend: function (xhr) {
                        var param = url;
                        var token = that.getCSRFToken(param);
                        xhr.setRequestHeader("X-CSRF-Token", token);
                        xhr.setRequestHeader("Accept", "application/json");
                        //    xhr.setRequestHeader("Authorization", "Bearer eyJhbGciOiJSUzI1NiIsImprdSI6Imh0dHBzOi8vYnN4LXRkZC1xcThha3pqbi5hdXRoZW50aWNhdGlvbi5ldTEwLmhhbmEub25kZW1hbmQuY29tL3Rva2VuX2tleXMiLCJraWQiOiJkZWZhdWx0LWp3dC1rZXktLTEyMTM1MTE0MDQiLCJ0eXAiOiJKV1QiLCJqaWQiOiAicnhZTkNZRm1hQWF4QlM0WjZKUDRabGhnc2xHUjRRUXdGT2EwLzZwVXMrOD0ifQ.eyJqdGkiOiJhODhlYjI2ZTliZDE0MDdhYTc4MTUyYWY2ZTI5NjhhZiIsImV4dF9hdHRyIjp7ImVuaGFuY2VyIjoiWFNVQUEiLCJzdWJhY2NvdW50aWQiOiI3YmMyZTRhMi1iMWZiLTQyMGUtOGZmMy0wYzE5MzhkNDE5YWIiLCJ6ZG4iOiJic3gtdGRkLXFxOGFrempuIn0sInN1YiI6InNiLW5hLWZkNjlkNzM5LWRkN2MtNDk5Ni05NzM5LTFhZjU5NGUwOGQwYiFhMTI0OTY5IiwiYXV0aG9yaXRpZXMiOlsieHNfdXNlci53cml0ZSIsInVhYS5yZXNvdXJjZSIsInhzX2F1dGhvcml6YXRpb24ucmVhZCIsInhzX2lkcC53cml0ZSIsInhzX3VzZXIucmVhZCIsInhzX2lkcC5yZWFkIiwieHNfYXV0aG9yaXphdGlvbi53cml0ZSJdLCJzY29wZSI6WyJ4c191c2VyLndyaXRlIiwidWFhLnJlc291cmNlIiwieHNfYXV0aG9yaXphdGlvbi5yZWFkIiwieHNfaWRwLndyaXRlIiwieHNfdXNlci5yZWFkIiwieHNfaWRwLnJlYWQiLCJ4c19hdXRob3JpemF0aW9uLndyaXRlIl0sImNsaWVudF9pZCI6InNiLW5hLWZkNjlkNzM5LWRkN2MtNDk5Ni05NzM5LTFhZjU5NGUwOGQwYiFhMTI0OTY5IiwiY2lkIjoic2ItbmEtZmQ2OWQ3MzktZGQ3Yy00OTk2LTk3MzktMWFmNTk0ZTA4ZDBiIWExMjQ5NjkiLCJhenAiOiJzYi1uYS1mZDY5ZDczOS1kZDdjLTQ5OTYtOTczOS0xYWY1OTRlMDhkMGIhYTEyNDk2OSIsImdyYW50X3R5cGUiOiJjbGllbnRfY3JlZGVudGlhbHMiLCJyZXZfc2lnIjoiOTM5YTExMWEiLCJpYXQiOjE2NzY0OTg4MzUsImV4cCI6MTY3NjU0MjAzNSwiaXNzIjoiaHR0cHM6Ly9ic3gtdGRkLXFxOGFrempuLmF1dGhlbnRpY2F0aW9uLmV1MTAuaGFuYS5vbmRlbWFuZC5jb20vb2F1dGgvdG9rZW4iLCJ6aWQiOiI3YmMyZTRhMi1iMWZiLTQyMGUtOGZmMy0wYzE5MzhkNDE5YWIiLCJhdWQiOlsic2ItbmEtZmQ2OWQ3MzktZGQ3Yy00OTk2LTk3MzktMWFmNTk0ZTA4ZDBiIWExMjQ5NjkiLCJ1YWEiLCJ4c191c2VyIiwieHNfaWRwIiwieHNfYXV0aG9yaXphdGlvbiJdfQ.WnnxstYfIPsQLDhJN-_yCgqwyzVppcwiXjLGifeRPfVyHq0GTPhj2PjOaS45fq3uj2gOC5UAfGxwr9xpyUiSk9iVJ8KdDy7yX5kwSAB_sqh2aDDyJb8qccQwiZHAuVZrDBmnGJXGSfNu5IAvwqr3SiXI2MfBI4Ti7SfeDFkxIbtk0N8twySjUWOlDA0_1nNR-IfGqqdxMNVCEeV8ANunQO8W_-2OmajeBqp4KMBdKu18H_4nXM7lQR-SaNgF0GT7rQA7Vfzbo5Yq_x4EIAKgOfosaAiF4uzLx4vMxetU38IMQiGkRHRYceBo01R2BwSyvHWIMgeEFo2NqWLJvSTZ_w");

                    },
                    success: function (oData, response) {
                        BusyIndicator.hide();
                        MessageBox.success("User has been created successfully in the subaccount");
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        BusyIndicator.hide();
                        MessageBox.error("User could not be created in subaccount, please re-try", errorThrown);
                    }
                }, this);

            },

            /* functions for create user - END */

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
                        MessageBox.error("Could not fetch logged in user details");
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
                        MessageBox.error("Could not fetch approvers");
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

            /*on cancel create user */
            onCancelCreateUser: function (oEvent) {
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
                if (sDate !== undefined) {
                    var sDate = new Date(sDate);
                    var sNewDate = sDate.toDateString();
                    return sNewDate;
                } else {
                    return "";
                }

            }
        });
    });