import React, { useState, useEffect } from "react";

const App = () => {
  const [clips, setClips] = useState([]); // State to store clips for the current layer
  const [loading, setLoading] = useState(true); // Loading state
  const [currentLayer, setCurrentLayer] = useState(1); // State to track the current layer

  // Custom names for clips, keyed by their index or ID
  const customNames = {
    0: "Clip A",
    1: "Clip B",
    2: "Clip C",
    // Add more mappings as needed
  };

  // Fetch clips for the given layer
  const fetchClipsForLayer = (layerIndex) => {
    setLoading(true); // Show loading while fetching clips
    fetch("http://localhost:8080/api/v1/composition")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error fetching composition: ${response.statusText}`);
        }
        return response.json();
      })
      .then((data) => {
        const layer = data.layers.find(
          (layer, index) => index + 1 === layerIndex
        );
        if (layer) {
          setClips(layer.clips || []); // Save clips from the specified layer
        } else {
          console.warn(`Layer ${layerIndex} not found!`);
          setClips([]); // Clear clips if layer not found
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch composition:", error);
        setLoading(false);
      });
  };

  // Load clips for the current layer on mount or when the layer changes
  useEffect(() => {
    fetchClipsForLayer(currentLayer);
  }, [currentLayer]);

  // Function to handle the click of a clip button
  const handleClipClick = (clipId, clipIndex) => {
    // Trigger the clip
    fetch(
      `http://localhost:8080/api/v1/composition/layers/${currentLayer}/clips/${clipIndex}/connect`,
      { method: "POST" }
    )
      .then((response) => {
        if (response.ok) {
          console.log("Clip connected to composition successfully!");

          // Switch to the next layer (Layer 2 in this case)
          setCurrentLayer(2);
        } else {
          console.error("Failed to connect the clip to composition");
        }
      })
      .catch((error) => console.error("Error connecting clip:", error));
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Layer {currentLayer} Clips</h1>

      {loading ? (
        <p>Loading clips...</p>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {clips.length > 0 ? (
            clips
              .filter((clip) => customNames[clip.id] || clip.name?.value) // Filter out empty or unnamed clips
              .map((clip, index) => (
                <button
                  key={clip.id}
                  className="p-4 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 focus:outline-none"
                  onClick={() => handleClipClick(clip.id, index + 1)} // Trigger the clip on click
                >
                  {customNames[index] || clip.name?.value}{" "}
                  {/* Use custom names */}
                </button>
              ))
          ) : (
            <p>No clips available for this layer.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
