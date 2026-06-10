import LibraryItem from './LibraryItem';

function LibraryGrid({ reviews = [], onItemClick = () => {} }) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {reviews.map((review) => {
                const album = {
                    id: review.spotifyAlbumId,
                    name: review.albumName,
                    artists: [{ name: review.artistName }],
                    images: [{ url: review.albumCover }]
                };
                return (
                    <LibraryItem 
                        key={review.id} 
                        album={album} 
                        review={review} 
                        onClick={() => onItemClick(review)}
                    />
                );
            })}
        </div>
    );
}

export default LibraryGrid;
