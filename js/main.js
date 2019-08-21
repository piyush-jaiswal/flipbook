const TOTAL_PAGES = CONFIG['TOTAL_PAGES'];
const IMAGE_PATH = CONFIG['IMAGE_PATH'];
const ALIVE_PAGES = CONFIG['ALIVE_PAGES'];
const IMAGE_EXTENSION = CONFIG['IMAGE_EXTENSION'];

const BB_SPEED = BB_CONFIG['SPEED'];
const BB_SHADOW_SIDES = BB_CONFIG['SHADOW_SIDES'];
const BB_SHADOW_FLIP = BB_CONFIG['SHADOW_FLIP'];


var Page = (function () {
    var config = {
            $bookBlock: $('#bb-bookblock'),
            $navNext: $('#bb-nav-next'),
            $navPrev: $('#bb-nav-prev'),
            $navFirst: $('#bb-nav-first'),
            $navLast: $('#bb-nav-last')
        },
        init = function () {
            var bbitems = Array.from({length: TOTAL_PAGES}, () => '<div class="bb-item"><figure class="d-flex"><span class="spinner-border text-primary mx-auto my-auto"></span></figure></div>');
            $('#book-cover-front').closest('.bb-item').after(bbitems);
            loadInitialImages();
            
            config.$bookBlock.bookblock({
                speed: BB_SPEED,
                shadowSides: BB_SHADOW_SIDES,
                shadowFlip: BB_SHADOW_FLIP,
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
                                $item.children('figure').append('<img src=' + img.src + ' alt=' + i + ' />');
                                $item.find('span.spinner-border').hide();
                            }
                        }
            
                        // play video again on navigation to front cover
                        if (page === 0) {
                            let $video = $('#book-cover-front > video');
                            let video = $video[0];
                            $video.attr('autoplay', 'true');
                            video.play();
                        }
                    }
                })(),
                onBeforeFlip: function (old, page) {
                    if (page > old && old === 0) {
                        let $video = $('#book-cover-front > video');
                        let video = $video[0];
                        video.pause();
                        let frameSrc = getCurrentFrame(video);
                        $video.attr('poster', frameSrc);
                        $video.removeAttr('autoplay');
                    }
                    else if (page < old && page === 0) {
                        let $video = $('#book-cover-front > video');
                        let video = $video[0];
                        video.currentTime = 0;
                        $video.removeAttr('poster');
                    }
                }
            });
            initEvents();
        },
        loadInitialImages = function () {
            var $items = config.$bookBlock.children('.bb-item');
            for (let i = 1; i <= ALIVE_PAGES; i++) {
                let img = new Image();
                img.src = IMAGE_PATH + i + IMAGE_EXTENSION;
                img.onload = function() {
                    let $item = $($items[i]);
                    $item.find('span.spinner-border').hide();
                    $item.children('figure').append('<img src=' + img.src + ' alt=' + i + ' />');
                }
            }
        },
        initEvents = function () {
            var $slides = config.$bookBlock.children();

            // add navigation events
            config.$navNext.on('click touchstart', function () {
                config.$bookBlock.bookblock('next');
                return false;
            });

            config.$navPrev.on('click touchstart', function () {
                config.$bookBlock.bookblock('prev');
                return false;
            });

            config.$navFirst.on('click touchstart', function () {
                config.$bookBlock.bookblock('first');
                return false;
            });

            config.$navLast.on('click touchstart', function () {
                config.$bookBlock.bookblock('last');
                return false;
            });

            // add swipe events
            $slides.on({
                'swipeleft': function (event) {
                    config.$bookBlock.bookblock('next');
                    return false;
                },
                'swiperight': function (event) {
                    config.$bookBlock.bookblock('prev');
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

                switch (keyCode) {
                    case arrow.left:
                        config.$bookBlock.bookblock('prev');
                        break;
                    case arrow.right:
                        config.$bookBlock.bookblock('next');
                        break;
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

function getCurrentFrame(video) {
    var canvas = document.createElement('canvas');
    canvas.height = video.videoHeight;
    canvas.width = video.videoWidth;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg');
}