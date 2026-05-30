import React, { useState, useEffect } from "react";
import axios from "axios";
import ZoomableImage from "./ZoomableImage";
import "./App.css";
import CustomButtonGroup from "./ButtonColor";
import { REACT_APP_URL_BE } from "./config";

function App() {
  const [images, setImages] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [resetKey, setResetKey] = useState(0); // State để lưu key cho ZoomableImage
  const [fileData, setFileData] = useState(null);
  const [classes, setClasses] = useState([]);


  useEffect(() => {
    axios
      .get(`${REACT_APP_URL_BE}/images`)
      .then((response) => {
        setImages(response.data);
      })
      .catch((error) => {
        console.error("Error fetching images:", error);
      });

    axios
      .get(`${REACT_APP_URL_BE}/get-classes`)
      .then((response) => {
        setClasses(response.data.jsonData.classes);
      })
      .catch((error) => {
        console.error("Error fetching images:", error);
      });
  }, []);

  const handleImageClick = (index) => {
    setSelectedImageIndex(index);
    setResetKey((prevKey) => prevKey + 1);
  };

  const toggleShowAll = () => {
    setShowAll(!showAll);
  };

  const showPreviousImage = () => {
    setSelectedImageIndex((prevIndex) =>
      prevIndex > 0 ? prevIndex - 1 : images.length - 1
    );
    setResetKey((prevKey) => prevKey + 1);
  };

  const showNextImage = () => {
    setSelectedImageIndex((prevIndex) =>
      prevIndex < images.length - 1 ? prevIndex + 1 : 0
    );
    setResetKey((prevKey) => prevKey + 1);
  };

  const selectedImage = images[selectedImageIndex];

  useEffect(() => {
    if (selectedImage) {
      axios
        .post(`${REACT_APP_URL_BE}/get-json-file`, {
          fileName: selectedImage.name,
        })
        .then((response) => {
          setFileData(response.data.jsonData);
        })
        .catch((error) => {
          console.error("Error fetching images:", error);
        });
    }
  }, [selectedImage]);

  return (
    <div className="app">
      <div className="d-flex flex-wrap justify-content-center">
        {!showAll &&
          images.slice(0, 30).map((image, index) => (
            <a
              key={index}
              onClick={() => handleImageClick(index)}
              data-bs-toggle="modal"
              data-bs-target="#imageModal"
              className="img-thumbnail"
            >
              <img
                src={image?.img1}
                alt={image?.name}
                className="img-fluid rounded m-3"
                style={{ cursor: "pointer", width: "150px" }}
              />
            </a>
          ))}

        {showAll &&
          images.map((image, index) => (
            <a
              key={index}
              onClick={() => handleImageClick(index)}
              data-bs-toggle="modal"
              data-bs-target="#imageModal"
              className="img-thumbnail"
            >
              <img
                src={image?.img1}
                alt={image?.name}
                className="img-fluid rounded m-3"
                style={{ cursor: "pointer", width: "150px" }}
              />
            </a>
          ))}
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <button className="btn btn-primary mt-3" onClick={toggleShowAll}>
          {showAll ? "Thu gọn" : "Xem thêm"}
        </button>
      </div>

      <div
        className="modal fade"
        id="imageModal"
        tabIndex="-1"
        aria-labelledby="staticBackdropLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-fullscreen p-5 pb-0">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="staticBackdropLabel">
                {selectedImage?.name}
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body row">
              <div className="col-10">
                {selectedImage && (
                  <div className="d-flex flex-column">
                    <div className="d-flex justify-content-center align-items-center mb-3">
                      <button
                        className="btn btn-secondary me-3"
                        onClick={showPreviousImage}
                        disabled={images.length === 0}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          fill="currentColor"
                          className="bi bi-caret-left-fill"
                          viewBox="0 0 16 16"
                        >
                          <path d="m3.86 8.753 5.482 4.796c.646.566 1.658.106 1.658-.753V3.204a1 1 0 0 0-1.659-.753l-5.48 4.796a1 1 0 0 0 0 1.506z" />
                        </svg>
                      </button>
                      <ZoomableImage key={resetKey} data={selectedImage} />
                      <button
                        className="btn btn-secondary ms-3"
                        onClick={showNextImage}
                        disabled={images.length === 0}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          fill="currentColor"
                          className="bi bi-caret-right-fill"
                          viewBox="0 0 16 16"
                        >
                          <path d="m12.14 8.753-5.482 4.796c-.646.566-1.658.106-1.658-.753V3.204a1 1 0 0 1 1.659-.753l5.48 4.796a1 1 0 0 1 0 1.506z" />
                        </svg>
                      </button>
                    </div>

                    <div className="w-100 mt-4">
                      <h6>More images:</h6>
                      <div className="d-flex flex-wrap justify-content-start">
                        {images
                          .filter((img, index) => index !== selectedImageIndex)
                          .slice(0, 19)
                          .map((image, index) => (
                            <a
                              key={index}
                              onClick={() =>
                                handleImageClick(images.indexOf(image))
                              }
                              className="img-thumbnail m-2"
                              data-bs-target="#imageModal"
                            >
                              <img
                                src={image?.img1}
                                alt={image?.name}
                                className="img-fluid rounded"
                                style={{ cursor: "pointer", width: "100px" }}
                              />
                            </a>
                          ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="col-2">
                <CustomButtonGroup />
                <CustomButtonGroup />
                <CustomButtonGroup />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
