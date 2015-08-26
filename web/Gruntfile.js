module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

	sass: {
		dist: {
			options: {
				style: 'expanded'
			},
			files: {
				'build/css/app.css': 'css/app.scss'
			}
		}
	},

    concat: {
		platformCss: {
			src: [
				'build/components/animate-css/animate.css',
				'build/components/angular-material/angular-material.css',
				'build/components/bootstrap/dist/css/bootstrap.css',
				'build/components/eonasdan-bootstrap-datetimepicker/build/css/bootstrap-datetimepicker.min.css',
				'build/components/angular-bootstrap-datetimepicker/src/css/datetimepicker.css',
			],

			dest: 'build/css/platform.css'
		},
    },

    browserify: {
		options: {
			browserifyOptions: {
				debug: true
			},
			transform: ['require-globify']
		},

		app: {
			src: [
				'src/entry.js'
			],

			dest: 'build/js/app.js'
		}
    },

	chmod: {
		options: {
			mode: 'go-w,a+rX'
		},

		all: {
			src: ['**/*']
		}
	},

    shell: {
        perms: {
			command: 'chmod go-w,a+rX build -Rf'
		}
    },
 
    watch: {
    	main: {
			files: [
				'Gruntfile.js',
				'src/**/*.js',
				'html/**/*.html',
				'css/**/*.scss',
				'brand/**/*.html',
				'brand/**/*.css',
				'app.html' 
			],
			tasks: ['default'],
			options: {
				reload: true
			}
		}
    },

	copy: {
		main: {
			files: [
				{
					src: 'app.html',
					dest: 'build/index.html'
				}
			]
		}
	},

    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
		compress: false,
		mangle: false,
		beautify: false
      }, 
      platform: {
        src: [
			'build/components/html5shiv/dist/html5shiv.js',
			'build/components/es6-promise/promise.js',
			'build/components/respond/src/respond.js',
			'build/components/dibello/dist/dibello.js',
			'build/components/moment/moment.js',

			'build/components/jquery/dist/jquery.js',
			'build/components/jquery-ui/jquery-ui.js',
//			'build/components/eonasdan-bootstrap-datetimepicker/build/js/bootstrap-datetimepicker.min.js',
//			'build/components/angular-bootstrap-datetimepicker/src/js/datetimepicker.js',
			'build/components/bootstrap/dist/js/bootstrap.js',

			'build/components/angular/angular.js',
            'build/components/angularjs-filters/filters.js',
			'build/components/angular-route/angular-route.js', 
			'build/components/angular-sanitize/angular-sanitize.js',
			'build/components/angular-animate/angular-animate.js',
			'build/components/angular-material/angular-material.js',
			'build/components/angular-ui-utils/ui-utils.js',
            'build/components/angular-bootstrap/ui-bootstrap-tpls.js',

			'build/components/angular-aria/angular-aria.js',
			'build/components/angular-ui-tinymce/src/tinymce.js',
			'build/components/angular-ui-sortable/sortable.js',

			'build/components/angular-material-icons/angular-material-icons.js'
		],
        dest: 'build/js/platform.min.js'
      },
      app: {
		src: [
			'build/js/app.js'
		],
		dest: 'build/js/app.min.js'
      },
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-chmod');
  grunt.loadNpmTasks('grunt-shell');

  // Default task(s).
  grunt.registerTask('default', ['browserify', 'sass', 'uglify', 'concat', 'copy', 'shell']);

};
