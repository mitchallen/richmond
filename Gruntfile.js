var semver = require("semver");

module.exports = function (grunt) {

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-bump');
    grunt.loadNpmTasks('grunt-shell');

    grunt.initConfig({

        // used by the changelog task
        pkg: grunt.file.readJSON('package.json'),

        jshint: {
            options: {
                node: true
            },
            all: ['*.js','./lib/*.js','./modules/*.js']
        },

        shell: {
            publish: {
                command: 'npm publish'
            },

            pubinit: {
                command: 'npm publish --access public'
            }
        },

        // To test: grunt bump --dry-run

        bump: {
            options: {

                commit: true,
                createTag: true,
                push: true,
                pushTo: 'origin',

                updateConfigs: ['pkg'],
                commitFiles: ['package.json']
            }
        },


        watch: {
             scripts: {
                files: ["./modules/*.js","./*.js"],
                tasks: ['build']
             }
        },

        upcoming: {
            default: {
                files: [
                    { src: 'package.json', dest: ['upcoming-info.json'] }
                ]
            }
        }

    });

    grunt.loadNpmTasks("grunt-browserify");
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks("grunt-contrib-watch");

    grunt.loadNpmTasks('grunt-upcoming');

    grunt.registerTask('default', ['upcoming:patch','build']);
    grunt.registerTask("build",   ['jshint']);
    grunt.registerTask('pubinit', ['build','shell:pubinit']);
    grunt.registerTask('publish', ['upcoming:patch','build','bump','shell:publish']);
};