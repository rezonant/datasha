module.exports = function(grunt) {
	var pkg = grunt.file.readJSON('package.json');
	
	// Project configuration.
	
	grunt.initConfig({
		pkg: pkg,
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
					'build/components/bootstrap/dist/css/bootstrap.css',
					'build/components/angular-material/angular-material.css',
					'build/components/angular-ui-grid/ui-grid.css',
					'build/components/eonasdan-bootstrap-datetimepicker/build/css/bootstrap-datetimepicker.min.css',
					'build/components/angular-bootstrap-datetimepicker/src/css/datetimepicker.css',
					'build/components/SpinKit/css/spinkit.css'
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
				src: ['.', '**/*']
			}
		},
		shell: {
			perms: {
				command: 'chmod go-w,a+rX build -Rf'
			}
		},
		watch: {
			gruntfile: {
				files: ['Gruntfile.js'],
				options: {
					reload: true
				},
				tasks: ['default', 'chmod']
			},
			sass: {
				files: [
					'css/**/*.scss'
				],
				tasks: ['sass', 'chmod']
			},
			js: {
				files: [
					'src/**/*.js',
				],
				tasks: ['browserify', 'chmod']
			},
			componentsJS: {
				files: [
					'build/components/**/*.js',
				],
				tasks: ['uglify', 'chmod']
			},
			componentsCSS: {
				files: [
					'build/components/**/*.css',
				],
				tasks: ['concat', 'chmod']
			},
			html: {
				files: [
					'html/**/*.html',
					'brand/**/*.html',
					'app.html'
				],
				tasks: ['copy', 'chmod', 'string-replace']
			}
		},
		copy: {
			main: {
				files: [
					{  
						src: 'app.html',
						dest: 'build/index.html', 
						mode: '644'
					},
					{ 
						src: 'img/**/*',
						dest: 'build/',
						mode: '644'
					},
					{src: 'build/components/angular-ui-grid/ui-grid.svg',
						dest: 'build/css/ui-grid.svg', mode: '644'},
					{src: 'build/components/angular-ui-grid/ui-grid.woff',
						dest: 'build/css/ui-grid.woff', mode: '644'},
					{src: 'build/components/angular-ui-grid/ui-grid.ttf',
						dest: 'build/css/ui-grid.ttf', mode: '644'}
				]
			}
		},
		'string-replace': {
			version: {
				files: {
					'build/index.html': 'build/index.html'
				},
				options: {
					replacements: [{
							pattern: /::VERSION::/ig,
							replacement: function (match) {
								return pkg.version;
							}
						}]
				}
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
					'build/components/sjcl/sjcl.js',
					'build/components/jquery/dist/jquery.js',
					'build/components/jquery-ui/jquery-ui.js',
//			'build/components/eonasdan-bootstrap-datetimepicker/build/js/bootstrap-datetimepicker.min.js',
//			'build/components/angular-bootstrap-datetimepicker/src/js/datetimepicker.js',
					'build/components/bootstrap/dist/js/bootstrap.js',
					'build/components/angular/angular.js',
					'build/components/angularjs-filters/filters.js',
					'build/components/angular-ui-grid/ui-grid.js',
					'build/components/angular-route/angular-route.js',
					'build/components/angular-sanitize/angular-sanitize.js',
					'build/components/angular-animate/angular-animate.js',
					'build/components/angular-material/angular-material.js',
					'build/components/angular-ui-utils/ui-utils.js',
					'build/components/angular-bootstrap/ui-bootstrap-tpls.js',
					'build/components/angular-aria/angular-aria.js',
					'build/components/angular-ui-tinymce/src/tinymce.js',
					'build/components/angular-ui-sortable/sortable.js',
					'build/components/angular-material-icons/angular-material-icons.js',
					'build/components/pdfmake/build/pdfmake.min.js',
					'build/components/pdfmake/build/vfs_fonts.js'

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
	grunt.loadNpmTasks('grunt-string-replace');

	// Default task(s).
	grunt.registerTask('default', ['browserify', 'sass', 'uglify', 'concat', 'copy', 'shell', 'string-replace']);

};
