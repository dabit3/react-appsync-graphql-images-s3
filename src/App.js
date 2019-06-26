import React, { useState, useReducer, useEffect } from 'react'
import './App.css'
import { withAuthenticator } from 'aws-amplify-react'
import { Storage, Auth, API, graphqlOperation } from 'aws-amplify'
import uuid from 'uuid/v4'
import { createUser } from './graphql/mutations'
import { listUsers } from './graphql/queries'
import { onCreateUser } from './graphql/subscriptions'
import ampConfig from './aws-exports'

const {
  aws_user_files_s3_bucket_region: region,
  aws_user_files_s3_bucket: bucket
} = ampConfig

const initialState = {
  users: []
}

function reducer(state, action) {
  switch(action.type) {
    case 'SET_USERS':
      return { ...state, users: action.users }
    case 'ADD_USER':
      return { ...state, users: [action.user, ...state.users] }
    default:
      return state
  }
}

function App() {
  const [file, updateFile] = useState({})
  const [state, dispatch] = useReducer(reducer, initialState)

  function handleChange(event) {
    const { target: { value, files } } = event
    const [image] = files || []
    updateFile(image || value)
  }

  async function fetchUsers() {
    try {
     // fetch all items from DB
     let users = await API.graphql(graphqlOperation(listUsers))
     users = users.data.listUsers.items
     // create Amazon S3 api calls for items in list
     const userRequests = users.map(u => Storage.get(u.avatar.key))
     // get signed Image URLs from S3 for each item in array by making the API call
     const userData = await(Promise.all(userRequests))
     // add new signed url to each item in array
     users.forEach((u, i) => {
       u.avatarUrl = userData[i]
     })
     dispatch({ type: 'SET_USERS', users })
    } catch(err) {
      console.log('error fetching users')
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const { identityId } = await Auth.currentCredentials()
    const { username } = await Auth.currentUserInfo()

    if (file) {
        const { name: fileName, type: mimeType } = file  
        const key = `${identityId}/${uuid()}${fileName}`
        const fileForUpload = {
            bucket,
            key,
            region,
        }
        const inputData = { username, avatar: fileForUpload }

        try {
          await Storage.put(key, file, {
            contentType: mimeType
          })
          await API.graphql(graphqlOperation(createUser, { input: inputData }))
          console.log('successfully stored user data!')
        } catch (err) {
          console.log('error: ', err)
        }
    }
}
  useEffect(() => {
    fetchUsers()
    const subscription = API.graphql(graphqlOperation(onCreateUser))
      .subscribe({
        next: async userData => {
          const { onCreateUser } = userData.value.data
          const avatarUrl = await Storage.get(onCreateUser.avatar.key)
          onCreateUser['avatarUrl'] = avatarUrl
          dispatch({ type: 'ADD_USER', user: onCreateUser })
        }
      })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <div className="App" style={styles.container}>
      <input
        abel="File to upload"
        type="file"
        onChange={handleChange}
        style={{margin: '10px 0px'}}
      />
      <button
        style={styles.button}
        onClick={handleSubmit}>Save Image</button>
      {
        state.users.map((u, i) => {
          return (
            <img
              key={i}
              style={{backgroundColor: 'red', width: '200px'}}
              src={u.avatarUrl}
            />
          )
        })
      }
    </div>
  )
}

const styles = {
  container: {
    width: 100,
    margin: '0 auto'
  },
  button: {
    width: 200,
    backgroundColor: '#ddd',
    cursor: 'pointer',
    height: 30,
    margin: '0px 0px 8px'
  }
}

export default withAuthenticator(App, { includeGreetings: true })