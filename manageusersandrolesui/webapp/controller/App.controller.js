sap.ui.define(
    [
        "sap/ui/core/mvc/Controller"
    ],
    function(BaseController) {
      "use strict";
  
      return BaseController.extend("uk.co.brakes.rf.manageusersandrolesui.controller.App", {
        onInit() {
          this._userModel = this.getOwnerComponent().getModel("userModel");
          let me = this;
          fetch("/getUserInformation")
            .then(res => res.json())
            .then(data => {
              me._userModel.setProperty("/", data);
            })
            .catch(err => console.log(err));
        }
      });
    }
  );
  