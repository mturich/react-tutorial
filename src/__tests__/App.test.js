import React from 'react'
import {render, screen, act, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'

//polyfill to the fetch api to run in an node env
import 'whatwg-fetch'
// to handle a REST like post request
import {setupServer} from 'msw/node'
import {rest} from 'msw'
import { loadStripe } from '@stripe/stripe-js'
import App from '../App.js'
import CART from '../shared/cart.js'

const server = setupServer(
   // res - response, req - request, ctx - context
   rest.get(
      'https://react-tutorial-demo.firebaseio.com/supermarket.json',
      (req, res, ctx) => {
         return res(ctx.json(CART))
      },
   ),
   rest.get(
      'https://react-tutorial-demo.firebaseio.com/productinfo/id1.json',
      (req, res, ctx) => {
         return res(ctx.json(CART[0]))
      },
   ),
)

beforeAll(() => server.listen({onUnhandledRequest: 'error'}))
afterEach(() => server.resetHandlers())
afterAll(() => {
   server.close()
   jest.clearAllMocks()
})

/* jest.mock('@stripe/stripe-js', () => {
   const untouchedStripe = jest.requireActual('@stripe/stripe-js')

   jest.spyOn(untouchedStripe, 'loadStripe').mockImplementation(() => {
      return Promise.resolve({
         id: 'pk_test_51LYDlMGSORg56XufAuLQAcUuWYgqHjkZTSx0fLYs4EecMc6bXVtwd4qnkJEGKP1u7aXAi6I45t6f8IJRzoLtGiDk00ABSxWOKu',
      })
   })

   return {...untouchedStripe}
}) */

//jest.mock('@stripe/stripe-js/pure')

//jest.spyOn(mockLoadStripe, 'redirectToCheckout').mockResolvedValueOnce((props) => 42)

/* // Step 1.
jest.mock("@stripe/stripe-js", () => {
   const original = jest.requireActual("@stripe/stripe-js"); // Step 2.
   return {
       ...original,
       mockLoadStripe: jest.fn()
   };
});

// Step 4. Inside of your test suite:
mockLoadStripe.mockResolvedValueOnce(() => {
   return new Promise(resolve => resolve() )
}); */

   test('tests the Product rendering by intercepting FETCH call', async () => {
      //loadStripe.mockResolvedValueOnce(42)
      const user = userEvent.setup()
      render(<App />)
      expect(screen.getByText(/Online shopping simplified/i)).toBeInTheDocument()
      expect(screen.getByText(/Home/i)).toBeInTheDocument()

      const cart = screen.getByRole('link', { name: /Cart/i })
      expect(cart).toBeInTheDocument()

      // Switch to Products
      const shopping = screen.getByRole('link', { name: /shopping/i })
      user.click(shopping)
      expect(await screen.findByText(/Cheese/)).toBeInTheDocument()
      expect(await screen.findByText(/200g cheese block/i)).toBeInTheDocument()

      //search for AddProdToCart Button
      const addCheeseToCart = await screen.findByRole('button', { name: /10/i })
      expect(addCheeseToCart).toBeInTheDocument()
      // add Cheese to the cart
      user.click(addCheeseToCart)
      expect(await screen.findByRole('link', { name: /(1)/i })).toBeInTheDocument()

      // checks if Product can be deleted
      const deleteProd = await screen.findByRole('button', { name: /x/i })
      expect(deleteProd).toBeInTheDocument()
      user.click(deleteProd)
      expect(await screen.findByRole('link', { name: /(0)/i })).toBeInTheDocument()

      // add another Cheese to the cart
      user.click(addCheeseToCart)
      expect(await screen.findByRole('link', { name: /(1)/i })).toBeInTheDocument()
      user.click(addCheeseToCart)
      expect(await screen.findByRole('link', { name: /(2)/i })).toBeInTheDocument()

      // switch to ProductDetail Page
      const prodDetailLink = screen.getByRole('link', { name: /cheese/i })
      user.click(prodDetailLink)

      expect(await screen.findByText(/Details/)).toBeInTheDocument()
      const detailLink = await screen.findByRole('link', { name: /Details/ })
      expect(detailLink).toBeInTheDocument()
      expect(await screen.findByRole('button', { name: /10/i })).toBeInTheDocument()

      const nutritionLink = screen.getByRole('link', { name: /Nutrition/i })
      expect(nutritionLink).toBeInTheDocument()

      user.click(nutritionLink)
      // something is needed to be checked. if the click backwards is done it fails
      expect(await screen.findByRole('table')).toMatchSnapshot('nutrition')
      user.click(detailLink)

      user.click(await screen.findByRole('button', { name: /10/i }))
      expect(await screen.findByRole('link', { name: /(3)/ })).toBeInTheDocument()
      //expect(await screen.findByRole('link', {name: /(3)/})).toBeInTheDocument()

      // Switch to Cart
      user.click(cart)
      expect(await screen.findByText('Your Cart')).toBeInTheDocument()
      // check for chart table
      expect(await screen.findByRole('table')).toMatchSnapshot('cart')

      //checks if
      const email = screen.getByLabelText(/Email/i)
      expect(email).toBeInTheDocument()
      expect(email).toHaveTextContent('')

      await act(() => user.type(email, 'onlineshop1@outlook.de'))
      expect(email).toHaveValue('onlineshop1@outlook.de')

      const pay = screen.getByRole('button', { name: /Pay/i })
      user.click(pay)

      //await waitFor(() => console.log(loadStripe.mock))
      //await waitFor(() => expect(loadStripe).toBeCalledTimes(1))
      //expect(mockLoadStripe).toHaveBeenCalledWith('paid with stripe')
   });
