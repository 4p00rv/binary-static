module.exports = function (grunt) {
    return {
        main: {
            options: {
                add    : (grunt.option('cleanup') ? false : true),
                base   : 'dist',
                branch : 'gh-pages',
                message: global.is_release ? `Release to ${global.release_target}` : `Deploy to ${global.branch || 'gh-pages'}`,
                ...(global.is_release && {
                    repo : global.release_info.target_repo,
                    clone: global.release_info.clone_folder,
                }),
            },
            src: global.branch ? [global.branch_prefix + global.branch + '/**'] : ['**', '.circleci/**', '!' + (global.branch_prefix || 'br_') + '*/**']
        },
        trigger_tests: {
            options: {
                add    : true,
                base   : 'dist',
                branch : 'temp',
                repo   : 'git@github.com:4p00rv/temp-test',
                user   : !grunt.option('ci') ? {} : {
                  name  : 'CircleCI',
                  email : 'sysadmin@binary.com'
                },
                message: 'Trigger tests',
            },
            src: grunt.option('staging') ? 'version' : '',
        },
    }
};
