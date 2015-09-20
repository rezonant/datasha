var ngm = angular.module(module.exports = 'datasha.ui.settings.settingsDialog', ['ngMaterial']);

ngm.factory('dtSettingsDialog', SettingsDialogService);
ngm.constant('SETTINGS_DIALOG_TEMPLATE', 'html/datasha/ui/settings/settingsDialog.html');

function SettingsDialogService($mdDialog, SETTINGS_DIALOG_TEMPLATE) {
	return {
		show: function($event) {
			$mdDialog.show({
				parent: angular.element(document.body),
				targetEvent: $event,
				templateUrl: SETTINGS_DIALOG_TEMPLATE,
				controller: SettingsDialogController
			});
		}
	}
}

function SettingsDialogController($scope, $mdDialog) {
	$scope.cancel = function() {
		$mdDialog.hide();
	}
}

