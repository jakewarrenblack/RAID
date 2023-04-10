import 'react-dropzone-uploader/dist/styles.css'
import Dropzone from "react-dropzone-uploader";
import {useEffect, useState} from "react";
import { getDroppedOrSelectedFiles } from 'html5-file-selector'
import BBoxAnnotator from "../components/annotate";

export const Upload = () => {

    const [files, setFiles] = useState([])
    const [annotations, setAnnotations] = useState([])

    // file status will change every time we add a file, since we've omitted the get upload params step
    const handleChangeStatus = ({ meta, file }, status) => {
        console.log(status, meta, file)

        // when status is 'done' the file has been prepared and validated

        if(status === 'done'){
            setFiles([
                ...files,
                file
            ])
        }
    }


    useEffect(() => {
        console.log('Files updated: ', files)
    }, [files])

    const myLayout = ({ input, previews, submitButton, dropzoneProps, files, extra: { maxFiles } }) => {
        const [selected, setSelected] = useState(0)
        const [annotations, setAnnotations] = useState([])
        const [annotatedFiles, setAnnotatedFiles] = useState([])

        useEffect(() => {
            const relevantFileExists = files.findIndex(annotation => annotation.fileName === files[selected].name) !== -1
            console.log('Relevant file exists: ', relevantFileExists)

            setAnnotatedFiles(
                files.map((file) => {
                    // means annotation with fileName matching file.name exists, apply the annotation to that file
                    if(relevantFileExists){
                        return {
                            file: files[selected],
                            annotation: annotations[annotations.findIndex(annotation => annotation.fileName === file.meta.name)]
                        }
                    }
                    else{
                        console.log('No annotation found for this file!!')
                        return file;
                    }
                })
            )
        }, [annotations])


        return (
            <div className={'h-full'}>
                <div className={'h-5/6'}>
                    {files[selected] && <MyPreview annotations={annotations} setAnnotations={setAnnotations} preview={files[selected].meta}/>}

                    {/*{files.length > 0 && submitButton}*/}
                </div>
                <div className={'flex flex-col'}>
                    <div className={'text-white flex w-full space-x-10 text-5xl justify-center'}>
                        {/* If on 0, don't let the user go back, if on the end, go back to the start */}
                        <button onClick={() => setSelected((selected !== 0 ? selected-1 : 0))}>prev</button>
                        <button onClick={() => setSelected((selected === previews.length -1 ? 0 : selected+1))}>next</button>
                    </div>
                    <div className={'mt-10 m-auto'}>
                        {files.length < maxFiles && input}
                    </div>
                </div>
            </div>
        )
    }


    const getFilesFromEvent = e => {
        return new Promise(resolve => {
            getDroppedOrSelectedFiles(e).then(chosenFiles => {
                resolve(chosenFiles.map(f => f.fileObject))
            })
        })
    }



    const MyPreview = ({preview, annotations, setAnnotations}) => {
        const labels = ['Cow', 'Sheep']

        console.log('Preview: ', preview)
        return (
            <div className={'h-full m-auto'}>
                <BBoxAnnotator
                    url={preview.previewUrl}
                    inputMethod="select"
                    labels={labels}
                    onChange={(annotationData) => {
                        if(annotationData.length){
                            if(annotationData[0].label){
                                setAnnotations([
                                    ...annotations,
                                    {
                                        ...annotationData,
                                        fileName: preview.name
                                    }
                                ])
                            }
                        }
                    }}
                />
                <button className={'text-white hover:cursor-pointer absolute'} onClick={(e) => {

                }}>submit</button>
            </div>
        )
    }




    const myInput = ({ accept, onFiles, files }) => {
        const text = files.length > 0 ? 'Add more files' : 'Choose files'

        return (
            <label style={{ backgroundColor: '#007bff', color: '#fff', cursor: 'pointer', padding: 15, borderRadius: 3, marginTop:100 }}>
                {text}
                <input
                    style={{ display: 'none' }}
                    type="file"
                    accept={accept}
                    multiple
                    onChange={e => {
                        getFilesFromEvent(e).then(chosenFiles => {
                            onFiles(chosenFiles)
                        })
                    }}
                />
            </label>
        )
    }

    return (
        <Dropzone

            onChangeStatus={handleChangeStatus}
            InputComponent={myInput}
            LayoutComponent={myLayout}
            PreviewComponent={MyPreview}
            accept="image/*"
        />
    )
}