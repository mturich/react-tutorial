import {renderHook} from '@testing-library/react'
import useFetch from '../useFetch.js'

test('returns logged in user', () => {
   const {result} = renderHook(() => useFetch())
   expect(result.current).toMatchInlineSnapshot(`
      Object {
        "get": [Function],
        "loading": true,
        "post": [Function],
      }
   `)
})
