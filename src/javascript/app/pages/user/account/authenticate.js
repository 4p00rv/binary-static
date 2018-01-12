const DocumentUploader    = require('binary-document-uploader');
const Client              = require('../../../base/client');
const displayNotification = require('../../../base/header').displayNotification;
const BinarySocket        = require('../../../base/socket');
const jpClient            = require('../../../common/country_base').jpClient;
const localize            = require('../../../../_common/localize').localize;
const Url                 = require('../../../../_common/url');
const showLoadingImage    = require('../../../../_common/utility').showLoadingImage;

const Authenticate = (() => {
    const onLoad = () => {
        BinarySocket.send({ get_account_status: 1 }).then((response) => {
            if (response.error) {
                $('#error_message').setVisibility(1).text(response.error.message);
            } else {
                const get_account_status  = response.get_account_status;
                const should_authenticate = +get_account_status.prompt_client_to_authenticate;
                const status = get_account_status.status;
                if (should_authenticate) {
                    if (!/authenticated/.test(status)) {
                        init();
                        $('#not_authenticated').setVisibility(1);
                        // Show upload instructions
                        if (!jpClient()) {
                            let link = 'https://marketing.binary.com/authentication/2017_Authentication_Process.pdf';
                            if (Client.isAccountOfType('financial')) {
                                $('#not_authenticated_financial').setVisibility(1);
                                link = 'https://marketing.binary.com/authentication/2017_MF_Authentication_Process.pdf';
                            }
                            $('#not_authenticated').find('.learn_more a').attr('href', link);
                            $('#not_authenticated').find('.learn_more').setVisibility(1);
                        }

                    } else if (!/age_verification/.test(status)) {
                        $('#needs_age_verification').setVisibility(1);
                    }
                } else if (/authenticated/.test(status)) {
                    $('#fully_authenticated').setVisibility(1);
                } else {
                    window.location.href = Client.defaultRedirectUrl();
                }
            }
        });
    };

    const init = () => {
        // Setup accordion
        $('.files').accordion({
            heightStyle: 'content',
            collapsible: true,
            active     : false,
        });
        // Setup Date picker
        const file_checks = {};
        $('.date-picker').datepicker({
            dateFormat : 'yy-mm-dd',
            changeMonth: true,
            changeYear : true,
            minDate    : '+6m',
        });

        $('.file-picker').on('change', onFileSelected);

        /**
         * Listens for file changes.
         * @param {*} event
         */
        function onFileSelected (event) {
            if (!event.target.files || !event.target.files.length) {
                resetLabel(event);
                return;
            }
            // Change submit button state
            showSubmit();
            const $e = $(event.target);
            const file_name = event.target.files[0].name || '';
            const display_name = file_name.length > 20 ? `${file_name.slice(0, 10)}...${file_name.slice(-10)}` : file_name;

            // Keep track of of files.
            fileTracker($e);

            $e.parent()
                .find('label')
                .off('click')
                // Prevent opening file selector.
                .on('click', (e) => {
                    if ($(e.target).is('span.remove')) e.preventDefault();
                })
                .text(display_name)
                .append($('<span/>', { class: 'remove' }))
                .find('.remove')
                .click(() => resetLabel(event));
        };

        // Reset file-selector label
        const resetLabel = (event) => {
            const $e = $(event.target);
            const default_text = $e.attr('data-placeholder');
            // Keep track of front and back sides of files.
            fileTracker($e, false); // untrack files
            // Remove previously selected file and set the label
            $e.val('').parent().find('label').text(default_text)
                .append($('<span/>', { class: 'add' }));
            // Change submit button state
            showSubmit();
        };

        /**
         * Enables the submit button if any file is selected, also adds the event handler for the button.
         * Disables the button if no files are selected.
         */
        let $button;
        const showSubmit = () => {
            let file_selected = false;
            const $ele = $('#authentication-message > div#not_authenticated');
            $button = $ele.find('#btn_submit');
            const $files = $ele.find('input[type="file"]');

            // Check if any files are selected
            $files.each((i, e) => {
                if (e.files && e.files.length) {
                    file_selected = true;
                }
            });

            if (file_selected) {
                if ($button.hasClass('button')) return;
                $button.removeClass('button-disabled')
                    .addClass('button')
                    .off('click') // To avoid binding multiple click events
                    .click(() => submitFiles($files));
            } else {
                if ($button.hasClass('button-disabled')) return;
                $button.removeClass('button')
                    .addClass('button-disabled')
                    .off('click');
            }
        };

        const disableButton = () => {
            if ($button.length && !$button.find('.barspinner').length) {
                const $btn_text = $('<span/>', { text: $button.find('span').text(), class: 'invisible' });
                showLoadingImage($button.find('span'), 'white');
                $button.find('span').append($btn_text);
            }
        };

        const enableButton = () => {
            if ($button.length && $button.find('.barspinner').length) {
                $button.find('>span').html($button.find('>span>span').text());
            }
        };

        /**
         * On submit button click
         */
        const submitFiles = ($files) => {
            // Disable submit button
            disableButton();
            const files = [];
            $files.each((i, e) => {
                if (e.files && e.files.length) {
                    const $e = $(e);
                    const type = `${($e.attr('data-type') || '').replace(/\s/g, '_').toLowerCase()}`;
                    const [, id] = ($e.attr('id').match(/([a-z]+)_(\d)/) || []);
                    const $inputs = $e.closest('.fields').find('input[type="text"]');
                    const file_obj = {
                        file: e.files[0],
                        type,
                        id,
                    };
                    if ($inputs.length) {
                        file_obj.id_number = $($inputs[0]).val();
                        file_obj.exp_date = $($inputs[1]).val();
                    }
                    files.push(file_obj);
                }
            });
            processFiles(files);
        };

        const processFiles = (files) => {
            const promises = [];
            const uploader = new DocumentUploader({ connection: BinarySocket.get() });

            readFiles(files).then((objects) => {
                objects.forEach(obj => promises.push(uploader.upload(obj)));
                Promise.all(promises)
                    .then(() => showSuccess())
                    .catch(showError);
            }).catch(showError);
        };

        // Returns file promise.
        const readFiles = (files) => {
            const promises = [];
            files.forEach((f) => {
                const fr = new FileReader();
                const promise = new Promise((resolve, reject) => {
                    fr.onload = () => {
                        const format = (f.file.type.split('/')[1] || (f.file.name.match(/\.([\w\d]+)$/) || [])[1] || '').toUpperCase();
                        const obj = {
                            filename      : f.file.name,
                            buffer        : fr.result,
                            documentType  : f.type,
                            documentFormat: format,
                            documentId    : f.id_number || undefined,
                            expirationDate: f.exp_date || undefined,
                        };

                        const error = { message: validate(Object.assign(obj, {id: f.id})) };
                        if (error && error.message) reject(error);

                        resolve(obj);
                    };

                    fr.onerror = () => {
                        reject(`Unable to read file ${f.file.name}`);
                    };
                    // Reading file.
                    fr.readAsArrayBuffer(f.file);
                });

                promises.push(promise);
            });

            return Promise.all(promises);
        };

        // Save file info to be used for validation and populating the file info
        const fileTracker = ($ele, track=true) => {
            const [, id, pos]       = ($ele.attr('id').match(/([a-z]+)_(\d)/) || []);
            if (track) {
                file_checks[id]            = file_checks[id] || {};
                file_checks[id].files      = file_checks[id].files || [];
                file_checks[id].files[pos] = true;
                file_checks[id].type      = $ele.attr('accept');
                file_checks[id].label     = $ele.attr('data-name');
            } else {
                file_checks[id].files[pos] = false;
            }
        };

        // Validate user input
        const validate = (file) => {
            // Add error messages here. Error messages are mapped by index to checks.
            const error_messages = [
                localize('Invalid document format: "[_1]" for [_2]', [file.documentFormat, file_checks[file.id].label]),
                localize('File ([_1]) size exceeds the permitted limit. Maximum allowed file size: 3MB', [file_checks[file.id].label]),
                localize('ID number is required for [_1].', [file_checks[file.id].label]),
                localize('Only letters, numbers, space, underscore, and hyphen are allowed for ID number ([_1]).', [file_checks[file.id].label]),
                localize('Expiry date is required for [_1].', [file_checks[file.id].label]),
                localize('Front and reverse side photos of [_1] are required.', [file_checks[file.id].label]),
                // Japan Error message
                localize('My number card is required.'),
            ];
            const [format, file_size, id, id_format, expiry, proofid,multiple_side_file_check,
                // Japan validations
                mynumbercard,
            ] = validations(file);
            let message = '';

            [format, file_size, id, id_format, expiry, proofid, multiple_side_file_check,
                // Japan validations
                mynumbercard,
            ].forEach((e,i) => {
                if (e) message+=`${error_messages[i]}<br />`;
            });

            return message;
        };

        // Add validations here.
        function* validations (file) {
            const isJp = jpClient();
            const required_docs = ['passport', 'proofid', 'driverslicense'];
            // Check if both front and back sides are selected for following file ids.
            const multiple_side_file_ids = ['proofid', 'driverslicense', 'residencecard', 'mynumbercard', 'mynumberphotocard'];
            // Document format check
            yield file_checks[file.id].type.indexOf(file.documentFormat.toLowerCase()) === -1;
            // File size check. Max 3MB
            yield file.buffer && file.buffer.byteLength >= 3 * 1024 * 1024;
            // ID check for docs. Only for non-japan clients
            yield !isJp && !file.documentId && required_docs.indexOf(file.documentType.toLowerCase()) !== -1;
            // ID format check
            yield file.documentId && !/^[\w\s-]{0,30}$/.test(file.documentId);
            // Expiration date check for docs. Only for non-japan clients
            yield !isJp && !file.expirationDate && required_docs.indexOf(file.documentType.toLowerCase()) !== -1;
            // Check for front and back side
            yield multiple_side_file_ids.indexOf(file.id) !== -1 &&
                (file_checks[file.id].files[0] ^ file_checks[file.id].files[1]);// eslint-disable-line no-bitwise

            // Validations for japan
            yield isJp && !((file_checks.mynumbercard && file_checks.mynumbercard.files[0]) ||
                (file_checks.mynumberphotocard && file_checks.mynumberphotocard.files[0]));
        }

        const showError = (e) => {
            const $error = $('.error-msg');
            const message = e.message || e.message_to_client;
            enableButton();
            $error.setVisibility(1).html(message);
            setTimeout(() => { $error.empty().setVisibility(0); }, 3000);
        };

        const showSuccess = () => {
            const msg = localize('We are reviewing your documents. For more details [_1]contact us[_2].',
                [`<a href="${Url.urlFor('contact')}">`, '</a>']);
            displayNotification(msg, false, 'document_under_review');
            $('#not_authenticated, #not_authenticated_financial').setVisibility(0); // Just hide it
            $('#success-message').setVisibility(1);
        };
    };

    return {
        onLoad,
    };
})();

module.exports = Authenticate;
