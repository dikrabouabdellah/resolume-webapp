import React, { useState, useEffect } from "react";

const App = () => {
  const [clips, setClips] = useState([]); // State to store clips for the current layer
  const [loading, setLoading] = useState(true); // Loading state
  const [currentLayer, setCurrentLayer] = useState(1); // State to track the current layer
  const [totalLayers, setTotalLayers] = useState(2); // Number of layers in the composition
  const [selectedClips, setSelectedClips] = useState({}); // Store selected clips by layer

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
        // Assuming total layers are available in the API, but we can dynamically set this
        setTotalLayers(data.layers.length);

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

  // Function to check if a slot is empty (no clip connected)
  const isSlotEmpty = (layerIndex, slotIndex) => {
    return fetch(
      `http://localhost:8080/api/v1/composition/layers/${layerIndex}/clips/${slotIndex}`
    )
      .then((response) => response.json())
      .then((data) => {
        return !data.clip || !data.clip.id; // If no clip is connected, it's empty
      })
      .catch((error) => {
        console.error("Error checking slot:", error);
        return false;
      });
  };

  // Function to handle the click of a clip button
  const handleClipClick = async (clipId, clipIndex) => {
    try {
      // Step 1: Select every clip in column 10 (last column) for all layers
      for (let layer = 1; layer <= totalLayers; layer++) {
        await fetch(
          `http://localhost:8080/api/v1/composition/layers/${layer}/clips/10/connect`,
          { method: "POST" }
        );
        console.log(`Connected clip in column 10 for layer ${layer}.`);
      }

      // Step 2: Now, connect the new clip to the current layer
      const response = await fetch(
        `http://localhost:8080/api/v1/composition/layers/${currentLayer}/clips/${clipIndex}/connect`,
        { method: "POST" }
      );

      if (response.ok) {
        console.log("Clip connected to composition successfully!");

        // Store the selected clip for the current layer
        setSelectedClips((prev) => ({
          ...prev,
          [currentLayer]: clipId, // Update to the newly selected clip
        }));

        // Step 3: Switch to the next layer
        const nextLayer = (currentLayer % totalLayers) + 1;
        setCurrentLayer(nextLayer);
      } else {
        console.error("Failed to connect the clip to composition");
      }
    } catch (error) {
      console.error("Error handling clip click:", error);
    }
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
                  className={`p-4 text-white rounded-lg shadow focus:outline-none ${
                    selectedClips[currentLayer] === clip.id
                      ? "bg-green-500 hover:bg-green-600"
                      : "bg-blue-500 hover:bg-blue-600"
                  }`}
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
