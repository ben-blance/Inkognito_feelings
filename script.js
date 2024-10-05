const enterSound = new Audio('sounds/falling.mp3');

function blackhole(element) {
    var h = $(element).height(),
        w = $(element).width(),
        cw = w,
        ch = h,
        maxorbit = 255, // distance from center
        centery = ch / 2,
        centerx = cw / 2;

    var startTime = new Date().getTime();
    var currentTime = 0;

    var stars = [],
        collapse = false, // if hovered
        expanse = false; // if clicked

    var canvas = $('<canvas/>').attr({width: cw, height: ch}).appendTo(element),
        context = canvas.get(0).getContext("2d");

    context.globalCompositeOperation = "multiply";

    function setDPI(canvas, dpi) {
        if (!canvas.get(0).style.width)
            canvas.get(0).style.width = canvas.get(0).width + 'px';
        if (!canvas.get(0).style.height)
            canvas.get(0).style.height = canvas.get(0).height + 'px';

        var scaleFactor = dpi / 96;
        canvas.get(0).width = Math.ceil(canvas.get(0).width * scaleFactor);
        canvas.get(0).height = Math.ceil(canvas.get(0).height * scaleFactor);
        var ctx = canvas.get(0).getContext('2d');
        ctx.scale(scaleFactor, scaleFactor);
    }

    function rotate(cx, cy, x, y, angle) {
        var radians = angle,
            cos = Math.cos(radians),
            sin = Math.sin(radians),
            nx = (cos * (x - cx)) + (sin * (y - cy)) + cx,
            ny = (cos * (y - cy)) - (sin * (x - cx)) + cy;
        return [nx, ny];
    }

    setDPI(canvas, 192);

    var star = function(){
        var rands = [];
        rands.push(Math.random() * (maxorbit/2) + 1);
        rands.push(Math.random() * (maxorbit/2) + maxorbit);

        this.orbital = (rands.reduce(function(p, c) {
            return p + c;
        }, 0) / rands.length);

        this.x = centerx;
        this.y = centery + this.orbital;
        this.yOrigin = centery + this.orbital; 
        this.speed = (Math.floor(Math.random() * 2.5) + 1.5)*Math.PI/180;
        this.rotation = 0;
        this.startRotation = (Math.floor(Math.random() * 360) + 1)*Math.PI/180;
        this.id = stars.length; 

        this.collapseBonus = this.orbital - (maxorbit * 0.7);
        if(this.collapseBonus < 0){
            this.collapseBonus = 0;
        }

        stars.push(this);
        this.color = 'rgba(255,255,255,'+ (1 - ((this.orbital) / 255)) +')';
        this.hoverPos = centery + (maxorbit/2) + this.collapseBonus;
        this.expansePos = centery + (this.id%100)*-10 + (Math.floor(Math.random() * 20) + 1);
        this.prevR = this.startRotation;
        this.prevX = this.x;
        this.prevY = this.y;
        
        this.isTextParticle = false;
    }

    star.prototype.draw = function(){
        if(!expanse){
            this.rotation = this.startRotation + (currentTime * this.speed);
            if(!collapse){
                if(this.y > this.yOrigin){
                    this.y-= 2.5;
                }
                if(this.y < this.yOrigin-4){
                    this.y+= (this.yOrigin - this.y) / 10;
                }
            } else {
                this.trail = 1;
                if(this.y > this.hoverPos){
                    this.y-= (this.hoverPos - this.y) / -5;
                }
                if(this.y < this.hoverPos-4){
                    this.y+= 2.5;
                }
            }
        } else {
            this.rotation = this.startRotation + (currentTime * (this.speed / 2));
            if(this.y > this.expansePos){
                this.y-= Math.floor(this.expansePos - this.y) / -140;
            }
        }

        context.save();
        context.fillStyle = this.color;
        context.strokeStyle = this.color;
        context.beginPath();
        var oldPos = rotate(centerx,centery,this.prevX,this.prevY,-this.prevR);
        context.moveTo(oldPos[0],oldPos[1]);
        context.translate(centerx, centery);
        context.rotate(this.rotation);
        context.translate(-centerx, -centery);
        context.lineTo(this.x,this.y);
        context.stroke();
        context.restore();

        this.prevR = this.rotation;
        this.prevX = this.x;
        this.prevY = this.y;
        
        if (this.isTextParticle) {
            context.save();
            context.fillStyle = 'rgba(255,255,255,' + this.textOpacity + ')';
            context.font = '20px Arial';
            context.fillText(this.char, this.x, this.y);
            context.restore();

            var dx = this.x - centerx;
            var dy = this.y - centery;
            var distance = Math.sqrt(dx * dx + dy * dy);
            var forceDirectionX = dx / distance;
            var forceDirectionY = dy / distance;
            var force = 0.5 + Math.random() * 0.5; // Randomize force for more natural movement
            this.x -= forceDirectionX * force;
            this.y -= forceDirectionY * force;
            this.textOpacity -= 0.02;

            if (this.textOpacity <= 0 || distance < 5) {
                var index = stars.indexOf(this);
                if (index > -1) {
                    stars.splice(index, 1);
                }
            }
        }
    }

    let showFinalMessage = false;
    let finalMessageTimer = null;

    $('.centerHover span').on('click', function(e){
        e.stopPropagation(); // Prevent the click from bubbling up to .centerHover
        var inputText = $('#textInput').val();
        if (inputText) {
            createTextParticles(inputText);
            $('#textInput').val('');

            enterSound.play().catch(error => {
                console.error("Error playing sound:", error);
            });

            // Set a timer to show the final message after 5 seconds
            finalMessageTimer = setTimeout(() => {
                showFinalMessage = true;
            }, 5000);
        }
        collapse = false;
        expanse = true;

        $('.centerHover').addClass('open');
        $('.fullpage').addClass('open');
        setTimeout(function(){
            $('.header .welcome').removeClass('gone');
        }, 500);
    });

    $('#textInput').on('click', function(e) {
        e.stopPropagation();
    });

    $('.centerHover').on('mouseover',function(){
        if(expanse == false){
            collapse = true;
        }
    });
    $('.centerHover').on('mouseout',function(){
        if(expanse == false){
            collapse = false;
        }
    });

    window.requestFrame = (function(){
        return  window.requestAnimationFrame       ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            function( callback ){
            window.setTimeout(callback, 1000 / 60);
        };
    })();

    function loop(){
        var now = new Date().getTime();
        currentTime = (now - startTime) / 50;

        context.fillStyle = 'rgba(25,25,25,0.2)';
        context.fillRect(0, 0, cw, ch);

        for(var i = 0; i < stars.length; i++){
            if(stars[i] != stars){
                stars[i].draw();
            }
        }

        if (showFinalMessage) {
            displayFinalMessage();
        }

        requestFrame(loop);
    }

    function init(time){
        context.fillStyle = 'rgba(25,25,25,1)';
        context.fillRect(0, 0, cw, ch);
        for(var i = 0; i < 2500; i++){
            new star();
        }
        loop();
    }
    init();

    function createTextParticles(text) {
        var fontSize = 20;
        context.font = fontSize + "px Arial";
        var textWidth = context.measureText(text).width;
        var startX = centerx - textWidth / 2;
        var startY = centery - 50; // Start above the center

        for (var i = 0; i < text.length; i++) {
            var char = text[i];
            var charWidth = context.measureText(char).width;
            var x = startX + context.measureText(text.substr(0, i)).width + charWidth / 2;
            
            var particle = new star();
            particle.isTextParticle = true;
            particle.char = char;
            particle.x = x + (Math.random() - 0.5) * 20; // Add some random spread
            particle.y = startY + (Math.random() - 0.5) * 20; // Add some random spread
            particle.yOrigin = startY;
            particle.textOpacity = 1;
            particle.speed = (Math.random() * 2 + 1) * Math.PI / 180; // Randomize speed
            
            stars.push(particle);
        }
    }

    function displayFinalMessage() {
        context.save();
        context.fillStyle = 'rgba(255,255,255,0.8)';
        context.font = '24px Arial';
        context.textAlign = 'center';
        context.fillText("Glad No One Heard It!", centerx, centery - 20);
        
        // Style "Try again?" like the ENTER button
        context.font = '18px Arial';
        var tryAgainText = "TRY AGAIN?";
        var textWidth = context.measureText(tryAgainText).width;
        var lineWidth = 16;
        var spacing = 12;
        
        // Draw left line
        context.beginPath();
        context.moveTo(centerx - textWidth/2 - spacing - lineWidth, centery + 20);
        context.lineTo(centerx - textWidth/2 - spacing, centery + 20);
        context.stroke();
        
        // Draw right line
        context.beginPath();
        context.moveTo(centerx + textWidth/2 + spacing, centery + 20);
        context.lineTo(centerx + textWidth/2 + spacing + lineWidth, centery + 20);
        context.stroke();
        
        // Draw text
        context.fillText(tryAgainText, centerx, centery + 25);
        
        // Create a clickable area for "TRY AGAIN?"
        var tryAgainWidth = textWidth + 2 * (spacing + lineWidth);
        var tryAgainHeight = 30; // Increase clickable area height
        var tryAgainLeft = centerx - tryAgainWidth / 2;
        var tryAgainTop = centery + 25 - tryAgainHeight / 2;
        
        // Add click event listener to the canvas
        canvas.on('click', function(event) {
            var rect = canvas[0].getBoundingClientRect();
            var x = event.clientX - rect.left;
            var y = event.clientY - rect.top;
            
            if (x >= tryAgainLeft && x <= tryAgainLeft + tryAgainWidth &&
                y >= tryAgainTop && y <= tryAgainTop + tryAgainHeight) {
                location.reload(); // Reload the page when "TRY AGAIN?" is clicked
            }
        });
        
        context.restore();
    }
}

// Initialize the black hole
$(document).ready(function() {
    blackhole('#blackhole');
});