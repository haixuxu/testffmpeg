interface SongInfo{
    song_id: string,
    isAccompany: number,
}


const url = 'https://y-dev.tuwan.com/yinsuda/';


async function fetchMP3AsUint8Array(url:string) {
    try {
        // 1. Fetch the MP3 file
        const response = await fetch(url);
        
        // Check if the response is ok (status code 200-299)
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // 2. Convert response to ArrayBuffer
        const arrayBuffer = await response.arrayBuffer();

        // 3. Convert ArrayBuffer to Uint8Array
        const uint8Array = new Uint8Array(arrayBuffer);

        return uint8Array;
    } catch (error) {
        console.error('Error fetching the MP3 file:', error);
    }
}


export async function downloadSongById(args:any){

    const url1 = `${url}${args.song_id}/output0.mp3`;
    const url2= `${url}${args.song_id}/output1.mp3`;
    // const mp3_files1_Bytes= await fetchMP3AsUint8Array(url1);
    // const mp3_files2_Bytes= await fetchMP3AsUint8Array(url2);

    const rets = await Promise.all([fetchMP3AsUint8Array(url1),fetchMP3AsUint8Array(url2)])

    return {
        status:0,
        data:{
            song_id: args.song_id,
            isAccompany: args.isAccompany,
            numberOfChannels: 2,
            mp3Data: rets
        }
    }
}