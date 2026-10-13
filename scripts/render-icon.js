// Renders assets/app-icon.svg to a transparent 1024px PNG with AppKit (no dependencies).
// Usage: osascript -l JavaScript scripts/render-icon.js <in.svg> <out.png>
ObjC.import('AppKit');
function run(argv) {
  const [src, out] = argv;
  const img = $.NSImage.alloc.initWithContentsOfFile(src);
  if (!img || !img.isValid) throw new Error('could not load ' + src);
  const rep = $.NSBitmapImageRep.alloc.initWithBitmapDataPlanesPixelsWidePixelsHighBitsPerSampleSamplesPerPixelHasAlphaIsPlanarColorSpaceNameBytesPerRowBitsPerPixel(
    null, 1024, 1024, 8, 4, true, false, $.NSDeviceRGBColorSpace, 0, 0);
  rep.size = $.NSMakeSize(1024, 1024);
  $.NSGraphicsContext.saveGraphicsState;
  $.NSGraphicsContext.setCurrentContext($.NSGraphicsContext.graphicsContextWithBitmapImageRep(rep));
  img.drawInRectFromRectOperationFraction($.NSMakeRect(0, 0, 1024, 1024), $.NSZeroRect, $.NSCompositingOperationSourceOver, 1);
  $.NSGraphicsContext.restoreGraphicsState;
  const png = rep.representationUsingTypeProperties($.NSBitmapImageFileTypePNG, $());
  if (!png.writeToFileAtomically(out, true)) throw new Error('could not write ' + out);
}
