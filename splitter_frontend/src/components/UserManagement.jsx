import React, { useState, useEffect } from "react";
import { UserPlus, Users, Trash2, ArrowLeft, ArrowRight } from "lucide-react";
import { splitService } from "../services/api";

const UserManagement = ({ receiptId, onUsersAdded, onBack }) => {
  const [users, setUsers] = useState([]);
  const [newUserName, setNewUserName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Fetch users from backend when component loads
  useEffect(() => {
    const fetchUsers = async () => {
      if (!receiptId) return;

      setIsLoadingUsers(true);
      try {
        console.log("Fetching users for receiptId:", receiptId);
        const backendUsers = await splitService.getUsersInSplit(receiptId);
        console.log("Fetched users from backend:", backendUsers);

        // Handle both single user object and array of users
        let usersArray = [];
        if (Array.isArray(backendUsers)) {
          usersArray = backendUsers;
        } else if (backendUsers && typeof backendUsers === "object") {
          // Single user object, convert to array
          usersArray = [backendUsers];
        }

        console.log("Processed backend users array:", usersArray);

        if (usersArray.length > 0) {
          // Filter out any invalid user objects and use backend users directly
          const validUsers = usersArray.filter(
            (user) => user && user.name && user.userId
          );
          console.log("Valid users from backend:", validUsers);

          if (validUsers.length > 0) {
            setUsers(validUsers);
            console.log("Set valid users from backend:", validUsers);
            // Removed auto-proceed logic - let user manually proceed
          } else {
            console.warn("No valid users found in backend response");
          }
        }
      } catch (err) {
        console.warn("Failed to fetch users from backend:", err);
        // Continue with empty users list - user can add manually
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [receiptId]);

  const addUser = async () => {
    if (!newUserName.trim()) {
      setError("Please enter a user name");
      return;
    }

    if (
      users.some(
        (user) => user.name.toLowerCase() === newUserName.toLowerCase()
      )
    ) {
      setError("User with this name already exists");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Create user data for backend
      const userData = {
        receiptId: receiptId,
        name: newUserName.trim(),
      };

      console.log("Adding user to backend:", userData);
      console.log(
        "User data being sent to POST /math/users:",
        JSON.stringify([userData], null, 2)
      );

      // Add user to backend and get the real user ID
      const response = await splitService.addUsersToSplit([userData]);
      console.log("Backend response for new user:", response);

      // Since backend returns success message, fetch updated users list
      const updatedUsers = await splitService.getUsersInSplit(receiptId);
      console.log("Updated users after adding:", updatedUsers);

      // Handle both single user object and array of users
      let usersArray = [];
      if (Array.isArray(updatedUsers)) {
        usersArray = updatedUsers;
      } else if (updatedUsers && typeof updatedUsers === "object") {
        // Single user object, convert to array
        usersArray = [updatedUsers];
      }

      console.log("Processed users array:", usersArray);

      if (usersArray.length > 0) {
        // Filter out any invalid user objects
        const validUsers = usersArray.filter(
          (user) => user && user.name && user.userId
        );
        console.log("Valid updated users:", validUsers);

        if (validUsers.length > 0) {
          setUsers(validUsers);
          console.log("Set valid updated users with backend IDs:", validUsers);
        } else {
          console.warn("No valid users in updated list, using fallback");
          const newUser = {
            userId: `temp_${Date.now()}`,
            name: newUserName.trim(),
            receiptId: receiptId,
          };
          setUsers([...users, newUser]);
          console.log("Added user with temporary ID:", newUser);
        }
      } else {
        // Fallback: create user locally with temporary ID
        const newUser = {
          userId: `temp_${Date.now()}`,
          name: newUserName.trim(),
          receiptId: receiptId,
        };
        setUsers([...users, newUser]);
        console.log("Added user with temporary ID:", newUser);
      }

      setNewUserName("");
    } catch (err) {
      console.error("Error adding user:", err);
      setError("Failed to add user. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const removeUser = async (userId) => {
    setUsers(users.filter((user) => user.userId !== userId));
    await splitService.removeUserFromSplit(receiptId, userId);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      addUser();
    }
  };

  const validateUserData = (userList) => {
    return userList.map((user) => {
      const userData = {
        receiptId: user.receiptId,
        name: user.name,
      };

      // Only include amount if it exists and is not 0
      if (user.amount && user.amount !== 0) {
        userData.amount = user.amount;
      }

      return userData;
    });
  };

  const saveUsers = async () => {
    if (users.length === 0) {
      setError("Please add at least one user");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Validate and clean user data before sending
      const validatedUsers = validateUserData(users);
      console.log("Sending users data to backend:", validatedUsers);
      console.log("Receipt ID (from backend):", receiptId);
      console.log("Expected format:", [
        {
          receiptId: receiptId,
          name: "Example User",
          // amount is optional
        },
        {
          receiptId: receiptId,
          name: "User with Amount",
          amount: 31.47,
        },
      ]);

      await splitService.addUsersToSplit(validatedUsers);
      console.log("Passing users to parent:", users);
      onUsersAdded(users); // Pass original users with userId for frontend tracking
    } catch (err) {
      console.error("Error saving users:", err);

      // Handle different types of errors
      if (err.response?.status === 500) {
        setError(
          "Backend service temporarily unavailable. Continuing with local data..."
        );
        // Continue with local data even if backend fails
        setTimeout(() => {
          onUsersAdded(users);
        }, 1000);
      } else if (err.response?.status === 400) {
        // Handle 400 Bad Request - likely data validation issues
        const errorMessage = err.response?.data || err.message;
        const errorString =
          typeof errorMessage === "string"
            ? errorMessage
            : String(errorMessage || "");

        if (errorString.includes("UserId") || errorString.includes("user")) {
          setError("User data validation issue. Continuing with local data...");
        } else {
          setError("Invalid user data format. Continuing with local data...");
        }
        // Continue with local data even if backend validation fails
        setTimeout(() => {
          onUsersAdded(users);
        }, 1000);
      } else if (err.response?.status === 404) {
        setError(
          "Service endpoint not found. Please check backend configuration."
        );
      } else if (err.code === "ERR_NETWORK") {
        setError("Network error. Please check your connection and try again.");
      } else {
        setError("Failed to save users. Continuing with local data...");
        // Continue with local data even if backend fails
        setTimeout(() => {
          onUsersAdded(users);
        }, 1000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="user-management">
      <div className="user-header">
        <h2>Add Users</h2>
        <p>Add people who will be splitting this bill</p>
      </div>

      <div className="add-user-section">
        <div className="input-group">
          <input
            type="text"
            placeholder="Enter user name"
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
            onKeyPress={handleKeyPress}
            className="user-input"
          />
          <button
            className="btn-add-user"
            onClick={addUser}
            disabled={!newUserName.trim()}
          >
            <UserPlus size={20} />
            Add User
          </button>
        </div>

        {error && (
          <div className="error-message">
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className="users-list">
        <h3>Users ({users.length})</h3>
        {isLoadingUsers ? (
          <div className="loading-users">
            <div className="spinner-small"></div>
            <p>Loading users from backend...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="no-users">
            <Users size={48} />
            <p>No users found</p>
            <p>Add users to continue with bill splitting</p>
          </div>
        ) : (
          <div className="users-grid">
            {console.log("Current users array:", users)}
            {users
              .filter((user) => user && user.name)
              .map((user) => (
                <div key={user.userId} className="user-card">
                  <div className="user-info">
                    <div className="user-avatar">
                      {(user.name || "U").charAt(0).toUpperCase()}
                    </div>
                    <div className="user-details">
                      <span className="user-name">
                        {user.name || "Unknown User"}
                      </span>
                      <span className="user-id">
                        ID: {user.userId || "N/A"}
                      </span>
                    </div>
                  </div>
                  <button
                    className="btn-remove-user"
                    onClick={() => removeUser(user.userId)}
                    title="Remove user"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>

      <div className="user-actions">
        <button className="btn-secondary" onClick={onBack}>
          <ArrowLeft size={20} />
          Back to Bill Details
        </button>
        <button
          className="btn-primary"
          onClick={() => onUsersAdded(users)}
          disabled={users.length === 0}
        >
          Continue to Splitting
          <ArrowRight size={20} />
        </button>
      </div>

      <div className="user-tips">
        <h4>Tips:</h4>
        <ul>
          <li>Add all people who will be sharing the bill</li>
          <li>You can add yourself as well</li>
          <li>Users can be added or removed later if needed</li>
        </ul>
      </div>
    </div>
  );
};

export default UserManagement;
