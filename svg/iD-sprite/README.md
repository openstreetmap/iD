These folders contain graphics used by iD.

### Overview

To add a graphic, create a `.svg` file and save it anywhere under here.

Some guidelines:
* `icons/`:       20x20px solid fill-only, used throughout iD
* `operations/`:  20x20px solid fill-only, used as commands
* `presets/`:     60x60px large preset icons
* `turns/`:       various sizes, graphics for turn restrictions
* `graphics/`:    miscellaneous stuff


### Controlling colors with CSS

We often use CSS to override the fill colors of the graphics.
In your SVG graphics, you can allow up to two override-able colors by using the following magic color values:

* `fill="currentColor"`
* `fill="inherit"`

For example, in `operation-reflect-long.svg`:
```svg
<svg version="1.1" x="0" y="0" width="20" height="20" viewBox="0 0 20 20">
    <path d="M9,18 L11,18 L11,2 L9,2 L9,18 z" fill="currentColor"/>
    <path d="M13,14 L13,6 L18,6 L18,8 L15,8 L15,14 M5,14 L5,8 L2,8 L2,6 L7,6 L7,14" fill="inherit"/>
</svg>
```

Elsewhere, in CSS:
```css
.flash-icon.operation use {
    fill: #222;     /* overrides the `inherit` */
    color: #79f;    /* overrides the `currentColor` */
}
.flash-icon.operation.disabled use {
    fill: rgba(32,32,32,0.7);       /* overrides the `inherit` */
    color: rgba(40,40,40,0.7);      /* overrides the `currentColor` */
}
```

This gives iD a lot of flexibility to control the runtime styling of the graphics.

The above example means that classing a button as `.disabled` will automatically grey out the colors (you don't need to make separate grey versions of every button).
