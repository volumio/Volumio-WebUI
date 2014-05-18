/*
 *  This Program is free software; you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation; either version 3, or (at your option)
 *  any later version.
 *
 *  This Program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  See <http://www.gnu.org/licenses/>
 *
 *  Authors:
 *  - v1:                    Joel Takvorian
 * 
 *  file:                    volumio.lazyloader.js
 *  version:                 1
 */

lazyLoaders = {
};

function LazyLoader(containerId, listId, nDisplayedItems, nTotalItems, batchSize, htmlCallback) {
    this.$container = $(containerId);
    this.$list = $(listId);
    this.nDisplayedItems = nDisplayedItems;
    this.nTotalItems = nTotalItems;
    this.batchSize = batchSize;
    this.htmlCallback = htmlCallback;
    var lastItem = Math.min(this.nDisplayedItems, this.nTotalItems) - 1;
    this.$list.html(htmlCallback(0, lastItem));
    this.$container.scrollTo(0);
    this.currentScope = {
        start: 0,
        end: lastItem,
        shift: function(delta) {this.start += delta; this.end += delta; }
    }
    this.eltHeight = this.$list.children().height();
    this.$container.on("scroll", this.scrollHandler);
    lazyLoaders[containerId] = this;
}

LazyLoader.prototype.$container = null;
LazyLoader.prototype.$list = null;
LazyLoader.prototype.eltHeight = 0;
LazyLoader.prototype.nDisplayedItems = 0;
LazyLoader.prototype.nTotalItems = 0;
LazyLoader.prototype.batchSize = 0;
LazyLoader.prototype.currentScope = undefined;
LazyLoader.prototype.htmlCallback = function() {};
LazyLoader.prototype.destroy = function() {
    this.$container.off("scroll", this.scrollHandler);
}
LazyLoader.prototype.getOffset = function() {
    return this.currentScope.start;
}
LazyLoader.prototype.lockTimout = null;
LazyLoader.prototype.checkLocked = function(onPass, timeout) {
    if (this.lockTimout == null) {
        var that = this;
        this.lockTimout = setTimeout(function() {
            that.lockTimout = null;
        }, timeout);
        onPass();
    }
}
LazyLoader.prototype.logDebug = function() {
    console.log("container:");
    console.log(this.$container);
    console.log("eltHeight: " + this.eltHeight);
    console.log("nDisplayedItems: " + this.nDisplayedItems);
    console.log("nTotalItems: " + this.nTotalItems);
    console.log("batchSize: " + this.batchSize);
    console.log("currentScope: " + this.currentScope.start + "," + this.currentScope.end);
}

LazyLoader.prototype.scrollHandler = function(e) {
    var that = lazyLoaders["#" + this.id];
    var margin = 20;
    var scrollpos = that.$container.scrollTop();
    if (that.$list.position().top > -margin) {
        // Reached top
        // "Prepend" new items
        var firstItem = Math.max(that.currentScope.start - that.batchSize, 0);
        var delta = that.currentScope.start - firstItem;
        if (delta > 0) {
            that.checkLocked(function() {
                that.$list.prepend(that.htmlCallback(firstItem, that.currentScope.start - 1));
                // Remove same quantity of bottom items
                that.$list.children().slice(-delta).remove();
                that.$container.scrollTop(scrollpos + that.eltHeight * delta);
                that.currentScope.shift(-delta);
            }, 100);
        }
    } else if (that.$list.position().top < margin + that.$container.height() - that.$list.height()) {
        // Reached bottom
        // Append new items
        var lastItem = Math.min(that.currentScope.end + that.batchSize, that.nTotalItems - 1);
        var delta = lastItem - that.currentScope.end;
        if (delta > 0) {
            that.checkLocked(function() {
                that.$list.append(that.htmlCallback(that.currentScope.end + 1, lastItem));
                // Remove same quantity of top items
                that.$list.children().slice(0, delta).remove();
                that.$container.scrollTop(scrollpos - that.eltHeight * delta);
                that.currentScope.shift(delta);
            }, 100);
        }
    }
}
