
var ngm = angular.module(module.exports = 'datasha.ui.lazyLoad', []);
 
ngm.directive('dtLazyLoad', LazyLoadDirective);

function LazyLoadDirective() {
	return {
		transclude: 'element',
		priority: 1200,
		terminal: true,
		restrict: 'A',
		compile: function(element, attr, linker) {
			return function(scope, iterStartElement, attr) {
				var hasBeenShown = false;
				var unwatchFn = scope.$watch(attr.dtLazyLoad, function(value) {
					if (!value || hasBeenShown)
						return;
					
					hasBeenShown = true;
					linker(scope, function (clone) {
						iterStartElement.after(clone);
					});
					unwatchFn();
				});
			};
		}
	}
}