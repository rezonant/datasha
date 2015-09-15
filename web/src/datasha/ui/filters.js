
var ngm = angular.module(module.exports = 'datasha.ui.filters', []);

ngm.filter('fileSize', function() {
    return function(input) {
        var value = 0.0 + parseInt(input);
        var label = " bytes";

        if (value > 1024) {
            value = value / 1024.0;
            label = " KB";
        }

        if (value > 1024) {
            value = value / 1024.0;
            label = " MB";
        }

        if (value > 1024) {
            value = value / 1024.0;
            label = " GB";
        }

        if (value > 1024) {
            value = value / 1024.0;
            label = " TB";
        }

        return Math.round(value*100)/100.0+label;
    };
});

ngm.filter('rowCount', function() {
    return function(input) {
		var label = '';
		if (input > 1000000) {
			input = Math.floor(input / 1000000.0);
			label = "M";
		} else if (input > 1000) {
			input = Math.floor(input / 1000.0);
			label = "K";
		}
		
		return input+label;
    };
});
ngm.filter('shortGuid', function() {
    return function(input) {
		if (!input)
			return '';
		return input.slice(0, 9)+'...';
    };
});

ngm.filter('dateTime', function() {
    return function(input) {
		
		if (!input)
			return 'Never'; 
		
		var date = new Date(input);
		var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct',
					  'Nov', 'Dec'];
		var month = months[date.getMonth() - 1];
		var hour = date.getHours();
		var ampm = 'AM';
		
		if (hour == 0) {
			hour = 12;
			ampm = 'AM';
		} else if (hour > 12) {
			hour -= 12;
			ampm = 'PM';
		} 
		
		var year = date.getYear() + 1900;
		var timeDetails = '';
		
		if (minutes > 0) {
			var minutes = (date.getMinutes() < 10 ? '0':'')+date.getMinutes();
			timeDetails += ':'+minutes;
		}
		
		if (seconds > 0) {
			var seconds = (date.getSeconds() < 10 ? '0':'')+date.getSeconds();
			timeDetails += ':'+seconds;
		}
		
		if (timeDetails !== '')
			timeDetails += ' ';
		
		return hour+timeDetails+ampm+' • '+month+' '+date.getDate()+' '+year;
    };
});

ngm.filter('trueFalse', function() {
    return function(input) {
		return input ? 'true' : 'false';
    };
});
