const tabListener = require('binary-style').tabListener;
const localize    = require('../../_common/localize').localize;
const urlParam    = require('../../_common/url').param;
const TNCApproval = require('../../app/pages/user/tnc_approval');

const TermsAndConditions = (() => {
    let sidebar_width;

    const onLoad = () => {
        const container = document.getElementsByClassName('sidebar-collapsible-container')[0];
        if (container) sidebar_width = container.offsetWidth;

        handleActiveTab(); // adds active class
        TNCApproval.requiresTNCApproval(
            $('#btn_accept'),
            () => { $('.tnc_accept').setVisibility(1); },
            () => { $('#tnc_accept').html(localize('Your settings have been updated successfully.')); });
        tabListener();

        $('.sidebar-collapsible').on('click', (e) => {
            const $target = $(e.target);
            if (!$target.is('a')) return;
            // if parent : prevent default and change hash to first link instead 
            const $sublinks = $target.siblings('ul');

            if ($sublinks.length) {
                // parent link is clicked
                e.preventDefault();

                if ($sublinks.find('.selected').length) {
                    // has any selected sublinks
                    $target.toggleClass('selected').parent('li').toggleClass('active');
                }
                else {
                    window.location.hash = $sublinks.find('a').first()[0].hash;
                }
            }
        });
        updateSidebar();

        checkWidth();
        window.onresize = checkWidth;

        $('.currentYear').text(new Date().getFullYear());
    };

    const handleActiveTab = () => {
        const params      = window.location.hash.split('&');
        const hash        = params[0] || '#legal';
        const sub_content = params[1];
        const menu        = '.tab-menu-wrap';
        const content     = '.tab-content-wrapper';

        const parent_active = 'active';
        const child_active  = 'a-active';

        $(menu)
            .find('li')
            .removeClass(parent_active)
            .find('span')
            .removeClass(child_active);

        let $tab_to_show = $(hash);
        // if hash is a subtab or has subtabs
        if ($tab_to_show.find('.tm-li-2').length > 0 || /tm-li-2/.test($(hash).attr('class'))) {
            $tab_to_show =
                $tab_to_show
                    .find('.tm-a-2')
                    .first()
                    .addClass(child_active)
                    .closest('.tm-li');
        }
        $tab_to_show.addClass(parent_active);

        let content_to_show = `div${hash}-content`;
        if ($(content_to_show).length === 0) {
            content_to_show = `div#${$(hash).find('.tm-li-2').first().attr('id')}-content`;
        }
        $(content)
            .find('> div')
            .setVisibility(0)
            .end()
            .find(content_to_show)
            .setVisibility(1);

        const section  = urlParam('section');
        const $content = $('#content');
        if (section) {
            const $section = $content.find(`a#${section}`);
            if ($section.length) setTimeout(() => { $.scrollTo($section, 0, { offset: -5 }); }, 500);
        } else if (hash) {
            setTimeout(() => { $.scrollTo($content.find('.tab-menu'), 0, { offset: -10 }); }, 500);
        }
        if (sub_content) {
            setTimeout(() => { $.scrollTo($content.find(`#${sub_content}`), 500, { offset: -10 }); }, 500);
        }
    };

    const updateSidebar = () => {
        const hash = window.location.hash || '#legal-binary';
        updateSidebarDOM(hash);
        updateSidebarContentDOM(`${hash}-content`);
    };

    const updateSidebarDOM = (link_id) => {
        const $sidebar = $('.sidebar-collapsible');
        // TODO: update sidebar visual state
        // link_id is selected
    };

    const updateSidebarContentDOM = (content_id) => {
        $(content_id).removeClass('invisible');
    };

    const checkWidth = () => {
        const mq = window.matchMedia('(max-width: 1023px)').matches;
        if (mq) {
            $('.sidebar-collapsible').css({ position: 'relative' });
            $(window).off('scroll', stickySidebar);
        } else {
            $(window).on('scroll', stickySidebar);
        }
        return mq;
    };

    const stickySidebar = () => {
        const $sidebar   = $('.sidebar-collapsible');
        const $content   = $('.sidebar-collapsible-content');
        const $container = $('.sidebar-collapsible-container');

        if (!$sidebar.is(':visible')) return;

        if (window.scrollY < $content.offset().top) {
            $sidebar.css({ position: 'relative' });
        } else if (window.scrollY + $sidebar[0].offsetHeight + 20 >=
            $container[0].offsetHeight + $container.offset().top) { // 20 is the padding for content from bottom, to avoid menu snapping back up
            $sidebar.css({ position: 'absolute', bottom: '20px', top: '', width: sidebar_width });
        } else {
            $sidebar.css({ position: 'fixed', top: '0px', bottom: '', width: sidebar_width });
        }
    };

    const onUnload = () => {
        $('.sidebar-collapsible').off('click');
    };

    return {
        onLoad,
        onUnload,
    };
})();

module.exports = TermsAndConditions;
