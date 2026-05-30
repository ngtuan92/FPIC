import React from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import "./ZoomableImage.css";

const ZoomableImage = ({ data, alt }) => {
  return (
    <div className="zoomable-container">
      <TransformWrapper
        initialScale={1}
        initialPositionX={0}
        initialPositionY={0}
        minScale={0.5}
        maxScale={4}
        centerOnInit={true}
        limitToBounds={false}
        panning={{ disabled: false }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <div className="tools">
              <button onClick={() => zoomIn()}>+</button>
              <button onClick={() => zoomOut()}>-</button>
              <button onClick={() => resetTransform()}>Reset</button>
            </div>
            <TransformComponent
              wrapperClass="transform-wrapper"
              contentClass="transform-content"
            >
              <img
                src={data}
                alt={alt}
                className="zoomable-image"
                width={"auto"}
                height={"80%"}
              />
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </div>
  );
};

export default ZoomableImage;
