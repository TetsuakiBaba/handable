class Trail {
    constructor(_color) {
        this.points = [];
        this.color = _color;
        this.timestamp = millis();
    }
    draw() {
        if (this.points.length <= 0) {
            return;
        }
        noFill();
        stroke(this.color);
        strokeWeight(width / 100);
        beginShape();
        curveVertex(this.points[0].x, this.points[0].y);
        let i = 0;
        for (let point of this.points) {
            let c = color(this.color);
            c.setAlpha(150);
            stroke(c);
            curveVertex(point.x, point.y);
            i++;
        }
        curveVertex(
            this.points[this.points.length - 1].x,
            this.points[this.points.length - 1].y
        );
        endShape();

        if ((millis() - this.timestamp) > 30) {
            if (this.points.length > 0) {
                this.points.shift();
                this.timestamp = millis();
            }
        }
    }
    get has_nothing_to_draw() {
        if (this.points.length <= 0) {
            return true;
        }
        return false;
    }
    addVertex(_x, _y) {
        this.points.push({
            x: _x,
            y: _y,
        });
        this.timestamp = millis();
        while (this.points.length > 30) {
            this.points.shift();
        }
        // if (this.points.length > 30) {
        //   this.points.shift();
        // }
    }
}

class Trails {
    constructor(_number) {
        this.color = ["#FA6950", "#DB2E8C", "#C672ED", "#9A93CF", "#C7DFFF"];
        this.trails = [];
        for (let i = 0; i < _number; i++) {
            this.trails[i] = new Trail(this.color[i]);
        }
    }
    addVertex(_points) {
        let count = 0;
        if (this.trails.length != _points.length) {
            console.log(
                "Error: does not match the array length",
                this.trails.length,
                _points.length
            );
        }
        for (let point of _points) {
            this.trails[count].addVertex(point.x, point.y);
            count++;
        }
    }
    get have_nothing_to_draw() {
        let count = 0;
        for (let trail of this.trails) {
            if (trail.has_nothing_to_draw == true) {
                count++;
            }
        }
        if (count == this.trails.length) {
            return true;
        }
        return false;
    }
    draw() {
        for (let trail of this.trails) {
            trail.draw();
        }
    }
    drawIndex() {
        this.trails[1].draw();
    }
}