module.exports = function(grunt) {
	var pkg = grunt.file.readJSON('package.json');
	var srcModule = './src/datasha';
	
	// Project configuration.
	
	grunt.initConfig({
		pkg: pkg,
		sass: {
			dist: {
				options: {
					style: 'expanded'
				},
				files: {
					'build/css/app.css': srcModule+'/assets/css/app.scss'
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
				src: 'src/datasha.js',
				dest: 'build/js/app.js'
			}
		}, 
		
		ngtemplates:  {
			'datasha.ui': {
				cwd:	'build',
				src:	'html/**/*.html',
				dest:	'build/js/templates.html.js'
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
					'src/**/*.scss'
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
					'src/**/*.html',
					'brand/**/*.html',
					'app.html'
				],
				tasks: ['copy', 'chmod', 'templates', 'string-replace']
			},

			img: {
				files: [
					'img/**'
				],
				tasks: ['copy']
			}
		},
		copy: {
			templates: {
				files: [
					{
						expand: true,
						cwd: 'src',
						src: '**/*.html',
						dest: 'build/html'
					}
				]
			},
			
			main: {
				files: [
					{  
						src: srcModule+'/ui/shell/shell.html',
						dest: 'build/index.html', 
						mode: '644'
					},
					{  
						src: srcModule+'/ui/shell/shell.html',
						dest: 'build/dev.html', 
						mode: '644'
					},
					{
						expand: true, 
						src: 'img/**',
						dest: 'build/',
						mode: '644'
					},
					//{src: 'img/logo.png', mode: '644', dest: 'build/img/logo.png' },
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
			},
			devVersion: {
				files: {
					'build/dev.html': 'build/dev.html'
				},
				options: {
					replacements: [{
						pattern: /::VERSION::/ig,
						replacement: function (match) {
							return '[DEV] '+pkg.version;
						}
					}]
				}
			},
			useMinJS: {
				files: {
					'build/index.html': 'build/index.html'
				},
				options: {
					replacements: [{
						pattern: /"js\/app.js"/ig,
						replacement: '"js/app.min.js"'
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
					'build/js/app.js',
					'build/js/templates.html.js'
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
	grunt.loadNpmTasks('grunt-angular-templates');

	// Default task(s).
	
	grunt.registerTask('templates', [
		'copy:templates', 
		'ngtemplates'
	]);
	
	grunt.registerTask('default', [
		'browserify', 
		'sass', 
		'templates', 
		'uglify', 
		'concat', 
		'copy:main', 
		'chmod', 
		'string-replace'
	]);
};
