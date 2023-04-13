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


        return Controller.extend("uk.co.brakes.rf.manageusersandrolesui.controller.DISPLAY.displayUsersRoles", {
            onInit: function () {
                var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
                var appPath = appId.replaceAll(".", "/");
                this.appModulePath = jQuery.sap.getModulePath(appPath);

                this.getOwnerComponent().getRouter().getRoute("RouteView1").attachPatternMatched(this._onManageRouteMatched, this);

                //Create JSON Model for IDP users
                var oIdpUsersModel = new sap.ui.model.json.JSONModel();
                this.getView().setModel(oIdpUsersModel, "oIdpUsersModel");

                var oIdpUsersCount = new sap.ui.model.json.JSONModel();
                oIdpUsersCount.setData({
                    count: ""
                });
                this.getView().setModel(oIdpUsersCount, "oIdpUsersCount");

                //Create JSON Model for available plants
                var oBrakesPlantsModel = new sap.ui.model.json.JSONModel();
                sap.ui.getCore().setModel(oBrakesPlantsModel, "oBrakesPlantsModel");

                this.fetchPlants();


                //Create JSON Model for single IDP user for editing
                var oIdpEditUserModel = new sap.ui.model.json.JSONModel();
                sap.ui.getCore().setModel(oIdpEditUserModel, "oIdpEditUserModel");

                this.oReadOnlyTemplate = new sap.m.ColumnListItem({
                    cells: [
                        new sap.m.ObjectIdentifier({
                            title: {
                                parts: [
                                    { path: "oIdpUsersModel>name/givenName" },
                                    { path: "oIdpUsersModel>name/familyName" },
                                    { path: "oIdpUsersModel>userName" }
                                ],
                                formatter: function (sGivenName, sFamilyName, sUserName) {
                                    var sFullName = sGivenName + " " + sFamilyName + " " + "(" + sUserName + ")";
                                    return sFullName;
                                }
                            },
                            text: {
                                path: 'oIdpUsersModel>emails',
                                formatter: function (aMailIds) {
                                    for (var i = 0; i < aMailIds.length; i++) {
                                        if (aMailIds[i].primary === true) {
                                            return aMailIds[i].value;
                                        }
                                    }
                                }
                            }
                        }),
                        new sap.m.Text({
                            text: "{oIdpUsersModel>userCategory}"
                        }),
                        new sap.m.Text({
                            text: "{oIdpUsersModel>plant}"
                        }),
                        new sap.m.Text({
                            text:
                            {
                                path: 'oIdpUsersModel>validTo',
                                formatter: function (sDate) {
                                    if (sDate !== undefined && sDate !== "") {
                                        var sDate = new Date(sDate);
                                        var sNewDate = sDate.toDateString();
                                        return sNewDate;
                                    } else {
                                        return "";
                                    }
                                }
                            }
                        }),
                        new sap.m.Switch({
                            state: { path: 'oIdpUsersModel>active' },
                            customTextOn : " ",
                            customTextOff : " ",
                            enabled: false
                        })
                    ]
                });
                //this.rebindTable(this.oReadOnlyTemplate, "Navigation");

                this.oEditableTemplate = new sap.m.ColumnListItem({
                    cells: [
                        new sap.m.ObjectIdentifier({
                            title: {
                                parts: [
                                    { path: "oIdpUsersModel>name/givenName" },
                                    { path: "oIdpUsersModel>name/familyName" },
                                    { path: "oIdpUsersModel>userName" }
                                ],
                                formatter: function (sGivenName, sFamilyName, sUserName) {
                                    var sFullName = sGivenName + " " + sFamilyName + " " + "(" + sUserName + ")";
                                    return sFullName;
                                }
                            },
                            text: {
                                path: 'oIdpUsersModel>emails',
                                formatter: function (aMailIds) {
                                    for (var i = 0; i < aMailIds.length; i++) {
                                        if (aMailIds[i].primary === true) {
                                            return aMailIds[i].value;
                                        }
                                    }
                                }
                            }
                        }),
                        new sap.m.ComboBox({
                            items: [
                                new sap.ui.core.Item({
                                    key: "Permanent",
                                    text: "Permanent"
                                }),
                                new sap.ui.core.Item({
                                    key: "Temporary",
                                    text: "Temporary"
                                })
                            ],
                            enabled: true,
                            value: "{oIdpUsersModel>userCategory}"
                        }),
                        new sap.m.ComboBox({
                            items: {
                                path: "oIdpUsersModel>/",
                                template: new sap.ui.core.Item({
                                    key: {
                                        path: 'oIdpUsersModel>plant'
                                    },
                                    text: {
                                        path: 'oIdpUsersModel>plant'
                                    }
                                })
                            },
                            enabled: true,
                            value: "{oIdpUsersModel>plant}"
                        }),
                        new sap.m.DatePicker({
                            value:
                            {
                                path: 'oIdpUsersModel>validTo',
                                formatter: function (sDate) {
                                    if (sDate !== undefined && sDate !== "") {
                                        var sDate = new Date(sDate);
                                        var sNewDate = sDate.toDateString();
                                        return sNewDate;
                                    } else {
                                        return "";
                                    }
                                }
                            }
                        }),
                        new sap.m.Switch({
                            state: { path: 'oIdpUsersModel>active' },
                            customTextOn : " ",
                            customTextOff : " ",
                        })
                    ]
                });
            },

            _onManageRouteMatched: function (oEvent) {
                this.setStickyPropertiesForTable();
                this.getLoggedInUserDetails();
                this.fetchAllIdpUsers();

                /*code for trying out capturing the JSON model changes */
                /* this.getView().byId("usersTable").getBinding("items").attachChange(this.captureTableChanges);
                this.getView().getModel("oIdpUsersModel").attachPropertyChange(function(oContext) { 
                    var x = 5;
                 });
                this.captureTableChanges(); */
            },

            captureTableChanges: function(oEvent){
                var x = oEvent.getSource();
            },

            setStickyPropertiesForTable: function(){
                var aStickyProps = ["ColumnHeaders", "HeaderToolbar"];
                var oTable = this.getView().byId("usersTable");
                oTable.setSticky(aStickyProps);
            },

            rebindTable: function (oTemplate, sKeyboardMode, oFilters) {
                var oTable = this.getView().byId("usersTable");
                //var oFilters = this.oFilters;
                BusyIndicator.show(500);
                oTable.bindItems({
                    path: 'oIdpUsersModel>/',
                //    filters : oFilters,
                    template: oTemplate,
                    templateShareable: true
                }).setKeyboardMode(sKeyboardMode);
                //this.getView().byId("usersTable").getBinding("items").filter(oFilters);
                BusyIndicator.hide();
            },

            onEditUser: function () {
                this.getView().byId("editUserBtn").setEnabled(false);
            //    this.getView().byId("saveChangesBtn").setEnabled(true);
            //    this.getView().byId("cancelChangesBtn").setEnabled(true);

                /*code to enable table editing */
            //    this.rebindTable(this.oEditableTemplate, "Edit", this.oFilters); 

                /*code to enable the row navigation of table */
                this.enableTableRowNavigation();
            },

            enableTableRowNavigation: function(){
                var oUsersTable = this.getView().byId("usersTable");
                var aRows = oUsersTable.getItems();
                for(var i = 0; i < aRows.length; i++){
                    aRows[i].setType("Navigation");
                    aRows[i].attachPress(this.navigateToUserEdit.bind(this));
                }
            },

            navigateToUserEdit: function(oEvent){
                var sPath = oEvent.getSource().oBindingContexts.oIdpUsersModel.sPath;
                //var oRow = [];
                //oRow.push(this.getView().getModel("oIdpUsersModel").getProperty(sPath));
                
                var oRow = this.getView().getModel("oIdpUsersModel").getProperty(sPath);
                sap.ui.getCore().getModel("oIdpEditUserModel").setData(oRow);
                this.getOwnerComponent().getRouter().navTo("editUsers");
            },

            onSaveUserChanges: function () {
                this.getView().byId("editUserBtn").setEnabled(true);
                this.getView().byId("saveChangesBtn").setEnabled(false);
                this.getView().byId("cancelChangesBtn").setEnabled(false);

                /*code to enable read-only mode of table */
                this.rebindTable(this.oReadOnlyTemplate, "Navigation", this.oFilters);
            },

            onCancelUserChanges: function () {
                this.getView().byId("editUserBtn").setEnabled(true);
                this.getView().byId("saveChangesBtn").setEnabled(false);
                this.getView().byId("cancelChangesBtn").setEnabled(false);

                /*code to enable read-only mode of table */
                this.rebindTable(this.oReadOnlyTemplate, "Navigation", this.oFilters);
            },

            getLoggedInUserDetails: function () {
                var sDest = "/user-api";
                var sUrl = this.appModulePath + sDest + "/currentUser";
                this.loggedinUserEmail = "";
                this.firstname = "";
                this.lastname = "";
                this.name = "";
                this.displayName = "";
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
                        BusyIndicator.hide();

                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        BusyIndicator.hide();
                        MessageBox.error("Password reset email could not be sent");
                    }
                }, that);
            },

            fetchAllIdpUsers: function () {
                //BusyIndicator.show(500);
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
                var startIndex = this.startIndex, totalResults, itemsPerPage;
                var that = this;
                var url = sUrl;
                //BusyIndicator.show();
                this.loadBusyDialog();
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
                                var sUserEntSchema = "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User";

                                var sValidTo = "", sValidToIso = "", sPlant = "";
                                if (aFinalResources[i][sUserSchema].validTo !== undefined) {
                                    sValidTo = aFinalResources[i][sUserSchema].validTo;
                                    sValidToIso = new Date(sValidTo).toISOString();
                                }

                                if (aFinalResources[i][sUserEntSchema] !== undefined && aFinalResources[i][sUserEntSchema].division !== undefined) {
                                    sPlant = aFinalResources[i][sUserEntSchema].division;
                                }

                                aFinalResources[i].userFullName = aFinalResources[i].name.givenName + " " + aFinalResources[i].name.familyName;
                                aFinalResources[i].validTo = sValidTo;
                                aFinalResources[i].validToIso = sValidToIso;
                                aFinalResources[i].plant = sPlant;

                                if (aFinalResources[i].userType !== undefined) {
                                    var sUserType = aFinalResources[i].userType.toUpperCase();
                                    var sUserCategory = "";

                                    switch (sUserType) {
                                        case "CUSTOMER":
                                            sUserCategory = "Permanent";
                                            break;
                                        case "EMPLOYEE":
                                            sUserCategory = "Permanent";
                                            break;
                                        case "PARTNER":
                                            sUserCategory = "Permanent";
                                            break;
                                        case "PUBLIC":
                                            sUserCategory = "Permanent";
                                            break;
                                        case "EXTERNAL":
                                            sUserCategory = "Temporary";
                                            break;
                                        case "ONBOARDEE":
                                            sUserCategory = "Permanent";
                                            break;
                                        default:
                                            sUserCategory = "";
                                    }

                                    aFinalResources[i].userCategory = sUserCategory;

                                } else {

                                    aFinalResources[i].userCategory = "";
                                }
                            }

                            aFinalResources.sort(function (a, b) {
                                return a.userFullName.localeCompare(b.userFullName);
                            });

                            that.getView().getModel("oIdpUsersModel").setData(aFinalResources);
                            that.sLastPUserId = aFinalResources[aFinalResources.length - 1][sUserSchema].userId;

                            that.setFiltersOnUsers();
                            /* var sRowCount = aFinalResources.length;
                            that.getView().getModel("oIdpUsersCount").setProperty("/count", sRowCount);
                            that.getView().getModel("oIdpUsersCount").refresh(true); */
                            //    BusyIndicator.hide();
                            that.hideBusyIndicator();
                        }

                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        //BusyIndicator.hide();
                        this.hideBusyIndicator();
                        MessageBox.error("Could not fetch the IDP users " + errorThrown);
                    }
                }, this);
            },

            loadBusyDialog: function () {
                if (!this._oBusyDialog) {
                    this._oBusyDialog = Fragment.load({
                        name: "uk.co.brakes.rf.manageusersandrolesui.fragments.BusyDialog",
                        controller: this
                    }).then(function (_oBusyDialog) {
                        this.getView().addDependent(_oBusyDialog);
                        //syncStyleClass("sapUiSizeCompact", this.getView(), _oBusyDialog);
                        return _oBusyDialog;
                    }.bind(this));
                }

                this._oBusyDialog.then(function (oBusyDialog) {
                    oBusyDialog.open();
                }.bind(this));
            },

            hideBusyIndicator: function () {
                this._oBusyDialog.then(function (oBusyDialog) {
                    oBusyDialog.close();
                });
            },

            setFiltersOnUsers: function (oEvent) {
                //var oUserNameFld = this.getView().byId("userNameInput");
                //    var oLastNameFld = this.getView().byId("lastNameInput");

                /* if (oUserNameFld.getTokens().length > 0) {
                    for (var i = 0; i < oUserNameFld.getTokens().length; i++) {
                        var sUserName = oUserNameFld.getTokens()[i].getText();
                        userNameFilter.push(new Filter("userFullName", FilterOperator.EQ, sUserName));
                    }
                } */
                this.oFilters = [];
                var plantFilter = [], userStatusFilter = [], userFilter = [], userNameFilter = [], userTypeFilter = [], expDateFilter = [], allFilter = [], sExpDate = "";

                /* */
                var sPlant = "";
                sPlant = this.getView().byId("plantCombobox").getSelectedKey();

                if(sPlant !== ""){
                    plantFilter.push(new Filter("plant", FilterOperator.EQ, sPlant));
                }

                var sUserStatus = "";
                if (this.getView().byId("userStatusInput").getValue() === "Active") {
                    sUserStatus = true;
                } else if (this.getView().byId("userStatusInput").getValue() === "Inactive") {
                    sUserStatus = false;
                }
                if (sUserStatus !== "") {
                    userStatusFilter.push(new Filter("active", FilterOperator.EQ, sUserStatus));
                }

                var sUserName = this.getView().byId("userNameInput").getValue();
                if (sUserName !== "") {
                    userFilter.push(new Filter("name/givenName", FilterOperator.Contains, sUserName));
                    userFilter.push(new Filter("name/familyName", FilterOperator.Contains, sUserName));
                }

                var sUserType = this.getView().byId("userTypeInput").getSelectedKey();
                //var oExpDateValue = this.getView().byId("expDatePicker").getDateValue();
                var sExpDateFrom = this.getView().byId("expDatePicker").getFrom();
                var sExpDateTo = this.getView().byId("expDatePicker").getTo();
                var sExpDateFromISO = "", sExpDateToISO = "";

                if (sExpDateFrom !== "" && sExpDateFrom !== null && sExpDateTo !== "" && sExpDateTo !== null) {
                    sExpDateFromISO = new Date(sExpDateFrom).toISOString();
                    sExpDateToISO = new Date(sExpDateTo).toISOString();

                    //expDateFilter.push(new Filter("validToIso", FilterOperator.GE, sExpDateFromISO));
                    //expDateFilter.push(new Filter("validToIso", FilterOperator.LE, sExpDateToISO));

                    expDateFilter = new Filter({
                        filters: [
                            new Filter("validToIso", FilterOperator.GE, sExpDateFromISO),
                            new Filter("validToIso", FilterOperator.LE, sExpDateToISO)
                        ],
                        and: true
                    });

                    /* expDateFilter = new Filter({
                        path: "validToIso",
                        operator: FilterOperator.BT,
                        value1: sExpDateFromISO,
                        value2: sExpDateToISO
                      });  */
                }

                if (sUserType !== "") {
                    userTypeFilter.push(new Filter("userCategory", FilterOperator.EQ, sUserType));
                }

                /* 
                if (userNameFilter.length > 0) {
                    allFilter.push(new Filter(userNameFilter, false));
                } */

                if (userFilter.length > 0) {
                    allFilter.push(new Filter(userFilter, false));
                }

                if (userTypeFilter.length > 0) {
                    allFilter.push(new Filter(userTypeFilter, false));
                }

                if (expDateFilter.aFilters !== undefined && expDateFilter.aFilters.length > 0) {
                    allFilter.push(new Filter(expDateFilter, false));
                }

                if (userStatusFilter.length > 0) {
                    allFilter.push(new Filter(userStatusFilter, false));
                }

                if (plantFilter.length > 0) {
                    allFilter.push(new Filter(plantFilter, false));
                }

                if (allFilter.length > 0) {
                    this.getView().byId("usersTable").getBinding("items").filter(allFilter);
                    this.oFilters = allFilter;
                } else {
                    this.getView().byId("usersTable").getBinding("items").filter();
                }

                var sRowCount = this.getView().byId("usersTable").getBinding("items").getLength();
                this.getView().getModel("oIdpUsersCount").setProperty("/count", sRowCount);
                this.getView().getModel("oIdpUsersCount").refresh(true);

            },

            onUserSearch: function (oEvent) {
                this.fetchAllIdpUsers();
            },

            onCreateNewUser: function (oEvent) {
                this.getOwnerComponent().getRouter().navTo("manageUsers");
            },

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
                        sap.ui.getCore().getModel("oBrakesPlantsModel").setData(oData.d.results);
                        var oBrakesPlantsModel = sap.ui.getCore().getModel("oBrakesPlantsModel");
                        that.getView().byId("plantCombobox").setModel(oBrakesPlantsModel, "oBrakesPlantsModel");
                        /* if (oData.d.results.length > 0) {
                            that.setDefaultPlant();
                        } */
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
                    var sPath = aPlants[i].oBindingContexts.oBrakesPlantsModel.sPath;
                    if (this.getView().getModel("oBrakesPlantsModel").getProperty(sPath).DefaultPlant == 'X') {
                        this.getView().byId("plantCombobox").setSelectedKey(aPlants[i].getProperty("key"));
                        this.sUserPlant = aPlants[i].getProperty("key");
                        break;
                    } else {
                        this.getView().byId("plantCombobox").setSelectedKey(aPlants[0].getProperty("key"));
                        this.sUserPlant = aPlants[0].getProperty("key");
                        break;
                    }
                }
                BusyIndicator.hide();
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
                if (sDate !== undefined && sDate !== "") {
                    var sDate = new Date(sDate);
                    var sNewDate = sDate.toDateString();
                    return sNewDate;
                } else {
                    return "";
                }

            }
        });
    });