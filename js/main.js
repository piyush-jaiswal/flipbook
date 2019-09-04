const TOTAL_PAGES = CONFIG['TOTAL_PAGES'];
const IMAGE_PATH = CONFIG['IMAGE_PATH'];
const ALIVE_PAGES = CONFIG['ALIVE_PAGES'];
const IMAGE_EXTENSION = CONFIG['IMAGE_EXTENSION'];


var Page = (function () {
    var config = {
            $bookBlock: $('#bb-bookblock'),
            $navNext: $('#bb-nav-next'),
            $navPrev: $('#bb-nav-prev'),
            $navFirst: $('#bb-nav-first'),
            $navLast: $('#bb-nav-last'),
            $totalCount: $('#total-count'),
            $currentPage: $('#current-page')
        },
        init = function () {
            var width = (window.innerWidth > 0) ? window.innerWidth : screen.width;
            var sizeClass = width <= 768 ? 'spinner-border-sm' : '';
            var bbitems = Array.from({length: TOTAL_PAGES}, () => '<div class="bb-item"><figure class="d-flex"><span class="spinner-border ' +  sizeClass + ' text-primary mx-auto my-auto"></span></figure></div>');
            $('#book-cover-front').closest('.bb-item').after(bbitems);
            intializePageCounter();
            loadInitialImages();
            
            var bookblock = config.$bookBlock.bookblock($.extend({}, BB_CONFIG, {
                onEndFlip: (function () {
                    var bbitemImages = {};
                    var $bbitems = $('#bb-bookblock').children('.bb-item');

                    return function (old, page, _) {
                        var oldStart = Math.max(this.startPage, old - Math.floor(ALIVE_PAGES / 2));
                        var oldEnd = Math.min(TOTAL_PAGES, oldStart + ALIVE_PAGES - 1);
                        var pageStart = Math.max(this.startPage, page - Math.floor(ALIVE_PAGES / 2));
                        var pageEnd = Math.min(TOTAL_PAGES, pageStart + ALIVE_PAGES - 1);
            
                        for (let i = oldStart; i <= oldEnd; i++) {
                            if (i >= pageStart && i <= pageEnd) {
                                continue;
                            }
                            let $item = $($bbitems[i]);
                            $item.find('span.spinner-border').show();
                            $item.find('img').remove();
            
                            // Stop downloading and remove images from memory
                            if (i in bbitemImages) {
                                bbitemImages[i].src = '';
                                bbitemImages[i].onload = null;
                                delete bbitemImages[i];
                            }
                        }
                        
                        for (let i = pageStart; i <= pageEnd; i++) {
                            if (i >= oldStart && i <= oldEnd) {
                                continue;
                            }
                            let $item = $($bbitems[i]);
                            let img = new Image();
                            img.src = IMAGE_PATH + i + IMAGE_EXTENSION;
                            bbitemImages[i] = img;
                            img.onload = function() {
                                $item.children('figure').append('<img class="p-1" src=' + img.src + ' alt=' + i + ' />');
                                $item.find('span.spinner-border').hide();
                            }
                        }
                    }
                })(),
            }));
            initEvents(bookblock);
        },
        loadInitialImages = function () {
            var $items = config.$bookBlock.children('.bb-item');
            for (let i = 1; i <= ALIVE_PAGES; i++) {
                let img = new Image();
                img.src = IMAGE_PATH + i + IMAGE_EXTENSION;
                img.onload = function() {
                    let $item = $($items[i]);
                    $item.find('span.spinner-border').hide();
                    $item.children('figure').append('<img class="p-1" src=' + img.src + ' alt=' + i + ' />');
                }
            }
        },
        intializePageCounter = function () {
            config.$totalCount.html(TOTAL_PAGES + 1);
        },
        initEvents = function (bookblock) {
            function navigate (action, ...args) {
                // FIXME: Plugin doesn't return boolean value on calling "config.$bookBlock.bookblock('isActive')"
                var instance = $.data(bookblock[0], 'bookblock');
                if (instance.isActive()) {
                    return false;
                }
                
                config.$bookBlock.bookblock(action, ...args);
                var currentPage = parseInt(config.$currentPage.attr('value'));
                switch (action) {
                    case 'next':
                        currentPage = Math.min(TOTAL_PAGES + 1, currentPage + 1);
                        break;
                    case 'prev':
                        currentPage = Math.max(0, currentPage - 1);
                        break;
                    case 'first':
                        currentPage = 0;
                        break;
                    case 'last':
                        currentPage = TOTAL_PAGES + 1;
                        break;
                    case 'jump':
                        currentPage = config.$currentPage.val();
                        break;
                }
                config.$currentPage.attr('value', currentPage);
                config.$currentPage.val(currentPage);
            }
            var $slides = config.$bookBlock.children();

            // add navigation events
            config.$navNext.on('click touchstart', function () {
                navigate('next');
                return false;
            });

            config.$navPrev.on('click touchstart', function () {
                navigate('prev');
                return false;
            });

            config.$navFirst.on('click touchstart', function () {
                navigate('first');
                return false;
            });

            config.$navLast.on('click touchstart', function () {
                navigate('last');
                return false;
            });

            // add swipe events
            $slides.on({
                'swipeleft': function (event) {
                    navigate('next');
                    return false;
                },
                'swiperight': function (event) {
                    navigate('prev');
                    return false;
                }
            });

            // add keyboard events
            $(document).keydown(function (e) {
                var keyCode = e.keyCode || e.which,
                    arrow = {
                        left: 37,
                        up: 38,
                        right: 39,
                        down: 40
                    };

                // 0-9 only
                if ((e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 96 && e.keyCode <= 105)) {
                    if (document.activeElement != config.$currentPage[0]) {
                        config.$currentPage.val('');
                        config.$currentPage.focus();
                    }
                }
                else if (keyCode === arrow.left) {
                    if (document.activeElement != config.$currentPage[0]) {
                        navigate('prev');
                    }
                }
                else if (keyCode === arrow.right) {
                    if (document.activeElement != config.$currentPage[0]) {
                        navigate('next');
                    }
                }
            });

            config.$currentPage.keydown(function (e) {
                // if the pressed key is "Enter"
                if (e.keyCode === 13) {
                    let val = parseInt(e.target.value);
                    if (val >= 0 && val <= TOTAL_PAGES + 1) {
                        navigate('jump', val + 1);
                        this.blur();
                    }
                }
            });
        };

    return {
        init: init
    };

})();


$(function() {
    document.getElementById('flipbook').focus();
    Page.init();
})