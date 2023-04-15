import "react-dropzone-uploader/dist/styles.css";
import Dropzone from "react-dropzone-uploader";
import { useCallback, useContext, useEffect, useState } from "react";
import { getDroppedOrSelectedFiles } from "html5-file-selector";
import BBoxAnnotator from "../components/annotate";
import axios from "axios";
import { AuthContext } from "../utils/AuthContext";

export const Upload = () => {
  const [selected, setSelected] = useState(0);
  const [annotatedFiles, setAnnotatedFiles] = useState([]);
  const [files, setFiles] = useState([]);
  const [annotations, setAnnotations] = useState([]);
  const [finalEntries, setFinalEntries] = useState([])

    useEffect(() => {
        console.log('Final entries change: ', finalEntries)
    }, [finalEntries])

  const { token } = useContext(AuthContext);

  useEffect(() => {
      if (files.length && finalEntries.length) {
          finalEntries.forEach((entry) => {
              // entry being the value returned from BBoxAnnotator with the appropriately transformed values...

              // need to pair them where file.name matches annotation.fileName

              // if the annotation's fileName attribute matches the name of one of our unnannotated files

              // when looking at an entry, i have access to the filename
              const relevantFile = files.find((file) => file.file.name === entry.fileName)

              console.log('Relevant file: ', relevantFile)

              if (relevantFile) {

                  const fileToBeAdded = {
                      file: relevantFile.file, // exclude all the metadata
                      annotation: entry,
                  };

                  setAnnotatedFiles(prevAnnotatedFiles => [
                      ...prevAnnotatedFiles,
                      fileToBeAdded
                  ])
              }
          })
      }
  }, [finalEntries])

    useEffect(() => {
        console.log('Annotated files change: ', annotatedFiles)
    }, [annotatedFiles])

  // file status will change every time we add a file, since we've omitted the get upload params step
  const handleChangeStatus = (
    fileWithMetadata,
    status,
    allFilesWithMetadata
  ) => {
    if (status === "done") {
      setFiles([...files, fileWithMetadata]);
    }
  };

  const myLayout = ({
    input,
    previews,
    submitButton,
    dropzoneProps,
    files,
    extra: { maxFiles },
  }) => {
    return (
      <div className={"h-full"}>
        <div className={"h-5/6"}>
          {files[selected] && <MyPreview preview={files[selected].meta} />}

          {files.length > 0 && submitButton}
        </div>
        <div className={"flex flex-col"}>
          <div
            className={
              "flex w-full justify-center space-x-10 text-5xl text-white"
            }
          >
            {/* If on 0, don't let the user go back, if on the end, go back to the start */}
            <button
              onClick={() => setSelected(selected !== 0 ? selected - 1 : 0)}
            >
              prev
            </button>
            <button
              onClick={() =>
                setSelected(selected === previews.length - 1 ? 0 : selected + 1)
              }
            >
              next
            </button>
          </div>
          <div className={"m-auto mt-10"}>
            {files.length < maxFiles && input}
          </div>
        </div>
      </div>
    );
  };

  const getFilesFromEvent = (e) => {
    return new Promise((resolve) => {
      getDroppedOrSelectedFiles(e).then((chosenFiles) => {
        resolve(chosenFiles.map((f) => f.fileObject));
      });
    });
  };

  const MyPreview = ({ preview }) => {
    const labels = ["Cow", "Sheep"];



    // We've changed bbox annotator to allow entries to be passed in
    // So we should try to find a relevant annotation entry for the image we're looking at right now

    return files[selected] ? (
      <div className={"m-auto h-full"}>
        <BBoxAnnotator
          url={files[selected].meta.previewUrl}
          entries={annotations}
          selected={selected}
          files={files}
          setEntries={setAnnotations}
          setFinalEntries={setFinalEntries}
          inputMethod="text"
          labels={labels}
        />
          <button
            className={"absolute right-0 text-white hover:cursor-pointer"}
            onClick={async (e) => {
                console.log('Submitting')
              if (annotatedFiles.length) {
                const formData = new FormData();

                  annotatedFiles.forEach((annotatedFile) => {
                  formData.append("files[]", annotatedFile.file);
                  formData.append(
                    "annotations[]",
                    JSON.stringify(annotatedFile.annotation)
                  );
                });


                  console.log('The entries that would be submitted are: ', annotatedFiles)

                axios
                  .post(
                    `http://localhost:5000/api/roboflow/uploadWithAnnotation`,
                    formData,
                    {
                      headers: {
                        "Content-Type": "multipart/form-data",
                        "x-auth-token": token,
                      },
                    }
                  )
                  .then((res) => console.log("API Response: ", res))
                  .catch((e) => console.error("Error: ", e));
              } else {
                alert("Annotate some images before submitting");
              }
            }}
          >
            FINAL SUBMIT
          </button>
      </div>
    ) : (
      ""
    );
  };

  const myInput = ({ accept, onFiles, files }) => {
    const text = files.length > 0 ? "Add more files" : "Choose files";

    return (
      <>
        <label
          style={{
            backgroundColor: "#007bff",
            color: "#fff",
            cursor: "pointer",
            padding: 15,
            borderRadius: 3,
            marginTop: 100,
          }}
        >
          {text}
          <input
            style={{ display: "none" }}
            type="file"
            accept={accept}
            multiple
            onChange={(e) => {
              getFilesFromEvent(e).then((chosenFiles) => {
                onFiles(chosenFiles);
              });
            }}
          />
        </label>
      </>
    );
  };

  return (
    <Dropzone
      onChangeStatus={handleChangeStatus}
      InputComponent={myInput}
      LayoutComponent={myLayout}
      PreviewComponent={MyPreview}
      accept="image/*"
    />
  );
};
